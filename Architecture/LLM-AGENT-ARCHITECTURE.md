# LLM Agent Architecture

> Sources: `backend/src/agent/`, `backend/src/common/llm-config.ts`, `backend/src/common/groq-client.ts`

Architecture of the web backend coaching agent (`AgentService`). Handles chat from the frontend (`POST /agent/chat`) and Telegram (`POST /agent/telegram-chat`). All responses are **non-streaming** JSON `{ text }`.

---

## 1. High-Level Agent Architecture

```mermaid
flowchart TB
    subgraph clients [Clients]
        FE["Next.js PaceBotChat.jsx"]
        TG["Telegram Bot"]
    end

    subgraph controller [AgentController]
        ChatEP["POST /agent/chat"]
        TgEP["POST /agent/telegram-chat"]
        FaqEP["GET /agent/faq-search"]
    end

    subgraph agentCore [AgentService]
        Intent["classifyIntent()"]
        Context["Context Assembly"]
        RAG["Pinecone RAG Retrieval"]
        FAQ["FaqService In-Memory Search"]
        Prompt["buildAgentSystemPrompt()"]
        Loop["Tool-Calling Loop max 10 steps"]
    end

    subgraph llmLayer [LLM Layer]
        Gemini["Gemini generateContent"]
        Groq["Groq chat completions fallback"]
    end

    subgraph tools [Agent Tools]
        MemoryTools["memory_read / memory_write"]
        PlanTools["get_weekly_plan / update_weekly_plan / plan_save / plan_load"]
        ActivityTools["list_activities"]
        StravaTools["strava_connect / strava_sync / strava_status"]
        GearTools["gear_list_bikes / gear_add_bike / gear_set_active_bike"]
        ZoneTools["calculate_zones"]
        FaqTool["faq_search"]
    end

    subgraph dataStores [Data Stores]
        Mongo[("MongoDB")]
        Pinecone[("Pinecone")]
        FaqCache["faq-chunks.json + faq-embeddings.json"]
        ChatHist[("AgentChatHistory")]
        AgentMem[("AgentMemory")]
    end

    FE --> ChatEP
    TG --> TgEP
    ChatEP --> Intent
    TgEP --> Intent

    Intent --> Context
    Context --> Mongo
    Intent --> RAG
    RAG --> Pinecone
    Intent --> FAQ
    FAQ --> FaqCache

    Context --> Prompt
    RAG --> Prompt
    FAQ --> Prompt
    Prompt --> Loop
    Loop --> Gemini
    Loop --> Groq
    Loop --> tools
    tools --> Mongo
    tools --> AgentMem
    Loop --> ChatHist
    Loop --> FE
```

Key files: `agent.controller.ts`, `agent.service.ts`, `agent-tools.ts`, `agent-system-prompt.ts`, `agent-intent.ts`, `agent-athlete-context.ts`.

---

## 2. Chat Request Flow

```mermaid
sequenceDiagram
    autonumber
    participant UI as Frontend / Telegram
    participant AC as AgentController
    participant AS as AgentService
    participant Intent as agent-intent.ts
    participant Store as AgentChatStoreService
    participant Ctx as agent-athlete-context.ts
    participant RAG as retrieveContext
    participant FAQ as FaqService
    participant LLM as Gemini / Groq
    participant Tools as agent-tools.ts

    UI->>AC: POST /agent/chat {message, chatId}
    AC->>AS: chat(userId, message, chatId)
    AS->>Intent: classifyIntent(message)

    alt intent = greeting
        AS-->>UI: hardcoded greeting (no LLM)
    else other intents
        AS->>Store: load(userId, chatId) — last 30 messages
        AS->>Ctx: buildAthleteProfile(userId)
        AS->>Ctx: buildActivitySummary / buildRaceContext / buildMonthSummary (by intent)
        AS->>AS: AgentMemoryService.getContext (if plan intent)

        opt shouldUseRag (activities intent only)
            AS->>RAG: embed query + Pinecone topK=5
            RAG-->>AS: Retrieved History block
        end

        opt shouldSearchFaq (faq or general intent)
            AS->>FAQ: search(message, k=3) cosine >= 0.3
            FAQ-->>AS: FAQ Knowledge block
        end

        AS->>AS: buildAgentSystemPrompt(SOUL + skills + context + RAG + FAQ)
        AS->>AS: filter tools by toolNamesForIntent(intent)

        loop max 10 steps
            AS->>LLM: generateContent(systemPrompt, history, toolDeclarations)
            alt functionCall in response
                AS->>Tools: execute(toolName, args, ToolDeps)
                Tools-->>AS: tool result
                AS->>AS: append functionResponse to history
            else text in response
                AS->>AS: finalText = part.text
            end
        end

        AS->>Store: appendMessage(user, assistant)
        AS-->>UI: {text: finalText}
    end
```

---

## 3. Intent Classification & Routing

```mermaid
flowchart TD
    Msg["User message"] --> Classify["classifyIntent() regex-based"]

    Classify --> Greeting["greeting"]
    Classify --> Activities["activities"]
    Classify --> Plan["plan"]
    Classify --> Zones["zones"]
    Classify --> Month["month"]
    Classify --> Strava["strava"]
    Classify --> Gear["gear"]
    Classify --> Faq["faq"]
    Classify --> General["general"]

    Greeting --> NoLLM["Hardcoded reply"]

    Activities --> RagYes["Pinecone RAG ON"]
    Activities --> ToolsAct["Tools: list_activities"]

    Plan --> MemYes["AgentMemory ON"]
    Plan --> ToolsPlan["Tools: get_weekly_plan, plan_load, update_weekly_plan"]

    Zones --> ToolsZone["Tools: calculate_zones"]

    Strava --> ToolsStrava["Tools: strava_connect, strava_sync, strava_status"]

    Gear --> ToolsGear["Tools: gear_list_bikes, gear_add_bike, gear_set_active_bike"]

    Faq --> FaqYes["FaqService search ON"]
    Faq --> ToolsFaq["Tools: faq_search"]

    General --> FaqYes
    General --> ToolsAll["Tools: memory_read, memory_write, plan_save, faq_search"]

    Month --> MonthCtx["buildMonthSummary from Mongo"]
```

| Intent | RAG (Pinecone) | FAQ search | Agent memory | Primary tools |
| --- | --- | --- | --- | --- |
| `greeting` | — | — | — | none |
| `activities` | yes | — | — | `list_activities` |
| `plan` | — | — | yes | `get_weekly_plan`, `plan_load`, `update_weekly_plan` |
| `zones` | — | — | — | `calculate_zones` |
| `month` | — | — | — | none (Mongo context only) |
| `strava` | — | — | — | `strava_connect`, `strava_sync`, `strava_status` |
| `gear` | — | — | — | `gear_list_bikes`, `gear_add_bike`, `gear_set_active_bike` |
| `faq` | — | yes | — | `faq_search` |
| `general` | — | yes | — | `memory_read`, `memory_write`, `plan_save`, `faq_search` |

Source: `agent-intent.ts`.

---

## 4. Context Assembly

```mermaid
flowchart LR
    subgraph mongoCtx [Mongo Context - agent-athlete-context.ts]
        Profile["Athlete profile: name, ftp, weight, goal, experience"]
        Recent["Recent 5 activities summary"]
        Races["Upcoming/recent races"]
        MonthSum["Monthly activity stats"]
    end

    subgraph vectorCtx [Vector Context - Pinecone RAG]
        EmbedQ["Embed user query"]
        Query["Pinecone query topK=5"]
        History["Retrieved History from meta.summary"]
    end

    subgraph faqCtx [FAQ Context - in-memory]
        FaqEmbed["Embed query via EmbeddingService"]
        Cosine["Cosine similarity vs faq-embeddings.json"]
        FaqBlock["FAQ Knowledge block threshold 0.3"]
    end

    subgraph memoryCtx [Agent Memory - Mongo AgentMemory]
        Sections["sections map: goals, preferences, schedule, etc."]
        Daily["dailyNotes array"]
        SavedPlan["currentPlan object"]
    end

    subgraph prompt [System Prompt - agent-system-prompt.ts]
        Soul["SOUL persona + coaching rules"]
        Skills["Skill instructions by intent"]
        Athlete["Merged athlete context block"]
        Retrieved["Retrieved History block"]
        FaqKnowledge["FAQ Knowledge block"]
        ToolsNote["Available tools note"]
    end

    Profile --> Athlete
    Recent --> Athlete
    Races --> Athlete
    MonthSum --> Athlete
    Sections --> Athlete
    EmbedQ --> Query --> History --> Retrieved
    FaqEmbed --> Cosine --> FaqBlock --> FaqKnowledge
    Soul --> prompt
    Skills --> prompt
    Athlete --> prompt
    Retrieved --> prompt
    FaqKnowledge --> prompt
    ToolsNote --> prompt
```

---

## 5. Tool-Calling Loop

```mermaid
flowchart TD
    Start["Build geminiHistory: last 30 chat messages + current user message"] --> Step["stepCount++"]
    Step --> MaxCheck{"stepCount > 10?"}
    MaxCheck -->|yes| Timeout["Return best effort or error"]
    MaxCheck -->|no| Provider{"LLM_PROVIDER?"}

    Provider -->|google or auto| CallGemini["callGemini(systemPrompt, history, tools)"]
    Provider -->|groq| CallGroq["callGroq(compactPrompt, history, tools)"]

    CallGemini -->|fail| CallGroq
    CallGroq -->|fail| CallGemini

    CallGemini --> Parse["Parse candidate.content.parts"]
    CallGroq --> Parse

    Parse --> HasFC{"functionCall present?"}
    HasFC -->|yes| ExecTool["tool.execute(args, ToolDeps)"]
    ExecTool --> AppendFR["Append functionResponse to history"]
    AppendFR --> AppendModel["Append model parts to history"]
    AppendModel --> Step

    HasFC -->|no text| FinalText["finalText = part.text"]
    FinalText --> Persist["chatStore.appendMessage"]
    Persist --> Return["Return {text}"]
```

**ToolDeps** injects per-user access to: `AgentMemoryService`, `TrainingContextService`, `Activity` model, `User` model, `Bike`/`Equipment` models, `FaqService`.

---

## 6. LLM Provider Routing

```mermaid
flowchart TB
    subgraph config [llm-config.ts]
        Provider["LLM_PROVIDER: google | groq | auto"]
        ChatKeys["GOOGLE_GENERATIVE_AI_API_KEY CSV"]
        GroqCfg["GROQ_API_KEY + GROQ_CHAT_MODEL + fallbacks"]
        Model["GOOGLE_LLM_MODEL default gemini-2.0-flash-lite"]
    end

    subgraph geminiCall [callGemini]
        Rotate["Rotate API keys on quota error"]
        Endpoint["generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"]
        Params["temperature 0.7, maxOutputTokens 2048"]
        Tools["functionDeclarations in request"]
    end

    subgraph groqCall [callGroq via groq-client.ts]
        Compact["buildCompactAgentSystemPrompt shorter context"]
        OpenAICompat["api.groq.com/openai/v1/chat/completions"]
        Retries["Up to 5 attempts + model fallbacks"]
        ParamsG["max_tokens 1024"]
    end

    Provider --> geminiCall
    Provider --> groqCall
    ChatKeys --> geminiCall
    GroqCfg --> groqCall
    geminiCall -->|"quota exhausted"| groqCall
    groqCall -->|"unavailable"| geminiCall
```

---

## 7. FAQ RAG (Separate from Activity RAG)

```mermaid
flowchart LR
    Boot["NestJS onModuleInit"] --> LoadChunks["Load backend/data/faq-chunks.json"]
    LoadChunks --> CacheCheck{"faq-embeddings.json exists?"}
    CacheCheck -->|yes| LoadCache["Load cached vectors"]
    CacheCheck -->|no| EmbedAll["Embed each Q+A via EmbeddingService"]
    EmbedAll --> SaveCache["Write faq-embeddings.json"]

    Query["faq_search tool or shouldSearchFaq"] --> EmbedQ["Embed query"]
    EmbedQ --> Cosine["Cosine similarity vs all FAQ vectors"]
    Cosine --> Filter["Keep score >= 0.3, top k"]
    Filter --> Return["Return question + answer chunks"]
```

FAQ is **not stored in Pinecone** — it lives in memory with a local disk cache.

---

## 8. Related LLM Callers (Outside Agent)

```mermaid
flowchart LR
    subgraph otherLLM [Other Backend LLM Callers]
        AnalysisSvc["AnalysisService"]
        ChatQuerySvc["ChatQueryService"]
        EmbedSvc["EmbeddingService"]
    end

    subgraph uses [Uses]
        DailyReview["Daily / weekly / monthly reviews"]
        PlanGen["Training plan generation"]
        ActAnalysis["Per-activity LLM analysis to llmAnalysis field"]
        ProfileChat["Read-only profile chat max 512 tokens"]
        Vectors["Activity + FAQ embeddings"]
    end

    AnalysisSvc --> DailyReview
    AnalysisSvc --> PlanGen
    AnalysisSvc --> ActAnalysis
    ChatQuerySvc --> ProfileChat
    EmbedSvc --> Vectors

    AnalysisSvc -->|"GOOGLE_SYNC / PLAN key pools"| Gemini["Gemini generateContent"]
    ChatQuerySvc --> Gemini
    EmbedSvc --> GeminiEmbed["gemini-embedding-001 REST"]
```

These share `llm-config.ts` key pools but are **not** part of the agent tool loop.

---

## Known Limitations

| Issue | Impact |
| --- | --- |
| RAG only for `activities` intent | Plans/zones/general miss historical ride context |
| Pinecone metadata lacks `summary` | Retrieved History block is often empty |
| No `userId` filter on Pinecone query | Cross-user retrieval risk |
| No streaming | High perceived latency on long answers |
| No reranking or score threshold on activity RAG | Low-quality matches injected into prompt |
| Regex intent classification | Miscategorization on ambiguous messages |

See [IMPROVEMENTS-BRAINSTORM.md](./IMPROVEMENTS-BRAINSTORM.md) for the prioritized fix plan.
