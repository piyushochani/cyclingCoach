# Cycling Coach — System Architecture

> Generated from code analysis on 2026-07-26. Sources: `backend/src`, `frontend/`, `packages/`.

There are two parallel AI stacks in this repo:

1. **Web backend** (`backend/src`) — NestJS + MongoDB + Pinecone + Gemini/Groq. This is the production path used by the frontend.
2. **CLI coach** (`packages/core` + `packages/sport-*`) — Vercel AI SDK based agent binaries. Not consumed by the web app.

This document focuses on the web backend, with notes where the CLI stack differs.

---

## 1. High-Level System Overview

```mermaid
flowchart TB
    subgraph client [Client Layer]
        Browser["Next.js 16 Frontend (Vercel)"]
        Telegram["Telegram Bot"]
        CLI["CLI Coach Binaries (packages/*)"]
    end

    subgraph backendLayer ["NestJS Backend (Railway, Express)"]
        Guards["Helmet / CORS / Throttler / JwtAuthGuard"]
        AgentMod["Agent Module (chat, FAQ)"]
        SyncMod["Sync Module (Strava)"]
        AnalysisMod["Analysis Module (reviews, plans, embeddings)"]
        OtherMods["User / Race / Plan / Stats / Gear / Expense / Subscription Modules"]
    end

    subgraph dataLayer [Data Layer]
        Mongo[("MongoDB (Mongoose)")]
        Pinecone[("Pinecone Vector Index 'CyclingCoach' 3072-d")]
        Redis[("Redis (BullMQ) - currently DISABLED, MockQueue in-process")]
    end

    subgraph externalSvcs [External Services]
        Strava["Strava API v3"]
        Gemini["Google Gemini (chat + embeddings)"]
        Groq["Groq (fallback chat LLM)"]
        SMTP["SMTP / Nodemailer (OTP)"]
        Cloudinary["Cloudinary (images)"]
    end

    Browser -->|"/api/* rewrite + Bearer JWT"| Guards
    Telegram -->|"POST /agent/telegram-chat"| Guards
    Guards --> AgentMod
    Guards --> SyncMod
    Guards --> AnalysisMod
    Guards --> OtherMods

    SyncMod --> Strava
    SyncMod --> AnalysisMod
    AnalysisMod --> Gemini
    AgentMod --> Gemini
    AgentMod --> Groq
    AnalysisMod --> Pinecone
    AgentMod --> Pinecone

    AgentMod --> Mongo
    SyncMod --> Mongo
    AnalysisMod --> Mongo
    OtherMods --> Mongo

    AnalysisMod -.->|"MockQueue (Redis unused)"| Redis
    OtherMods --> SMTP
    OtherMods --> Cloudinary

    CLI -->|"own stack: AI SDK + Pinecone"| Pinecone
```

Key files:

- Entry: `backend/src/main.ts`, `backend/src/app.module.ts`
- Frontend API client: `frontend/lib/api.ts` (Bearer JWT from localStorage, `/api` rewrite in `frontend/next.config.ts`)

---

## 2. Data Ingestion and Vector Upsert Flow (Strava → Pinecone)

How an activity goes from Strava into MongoDB and Pinecone. Triggered by `POST /sync/*` or fire-and-forget after login — **runs in the HTTP request path today**, not in a worker.

```mermaid
sequenceDiagram
    participant U as User / Login hook
    participant SC as SyncController
    participant SS as SyncService
    participant ST as Strava API
    participant M as MongoDB
    participant DP as DataProcessorService
    participant SB as SummaryBuilderService
    participant EM as EmbeddingService (gemini-embedding-001)
    participant PC as PineconeClient
    participant AQ as analysis queue (MockQueue)

    U->>SC: POST /sync/incremental
    SC->>SS: incrementalSync(userId)
    SS->>ST: list activities + fetch details + streams
    ST-->>SS: activity JSON + streams
    SS->>M: upsert Activity (embeddingStatus=pending, rawActivity, rawStreams)
    SS->>DP: process(activity) - zones, NP, session type
    DP-->>SB: processed metrics
    SB-->>SS: summaryText (multi-line text)
    SS->>EM: embedText(summaryText)
    EM-->>SS: 3072-d vector (key rotation, 200ms throttle)
    SS->>PC: upsert id=userId-activity_stravaId + metadata
    Note over PC: BUG: metadata has userId, date, sessionType, etc.<br/>but NOT the summary text itself
    SS->>M: set summaryText, vectorId, embeddingStatus=done
    SS->>AQ: add('activity', {activityId, userId})
    Note over AQ: BUG: payload omits type='activity'<br/>which AnalysisProcessor checks
    AQ->>M: (MockQueue direct) LLM analysis -> llmAnalysis field
```

Pipeline classes: `SyncService` → `ActivitySyncPipelineService.processActivity` → `DataProcessorService` / `SummaryBuilderService` / `EmbeddingService` / `PineconeClient` (all under `backend/src/analysis/`).

**FAQ ingestion (separate, not Pinecone):** on boot, `FaqService` loads `backend/data/faq-chunks.json`, embeds Q+A into memory, caches vectors to `backend/data/faq-embeddings.json`.

---

## 3. Query-Time RAG Chain (Agent Chat)

```mermaid
flowchart TD
    Msg["POST /agent/chat {message, chatId}"] --> Intent["classifyIntent(message) - agent-intent.ts"]
    Intent -->|greeting| Canned["Hardcoded reply - no LLM, no RAG"]
    Intent -->|other| Ctx["Assemble Mongo context by intent: profile, recent rides, plan, races, agent memory"]

    Ctx --> RagGate{"shouldUseRag? (only intent == 'activities')"}
    RagGate -->|yes| Embed["EmbeddingService.embedText(query)"]
    Embed --> PQuery["Pinecone query topK=5 (no userId filter, no score threshold)"]
    PQuery --> RetBlock["'Retrieved History' block from meta.summary"]
    RagGate -->|no| SkipRag["Skip vector retrieval"]

    Ctx --> FaqGate{"intent == faq or general?"}
    FaqGate -->|yes| Faq["FaqService.search - in-memory cosine, threshold 0.3"]
    FaqGate -->|no| SkipFaq["Skip FAQ"]

    RetBlock --> Prompt["buildAgentSystemPrompt: SOUL + skills + athlete context + retrieved + FAQ"]
    SkipRag --> Prompt
    Faq --> Prompt
    SkipFaq --> Prompt

    Prompt --> Loop["Tool-calling loop (max 10 steps)"]
    Loop --> LLMCall["Gemini generateContent OR Groq fallback"]
    LLMCall -->|tool call| Tools["agent-tools.ts (incl. faq_search)"]
    Tools --> Loop
    LLMCall -->|final text| Persist["Persist AgentChatHistory (Mongo)"]
    Persist --> Resp["Return {text} - NO streaming"]
```

Key files: `backend/src/agent/agent.service.ts`, `agent-intent.ts`, `agent-system-prompt.ts`, `agent-athlete-context.ts`, `agent-tools.ts`, `faq.service.ts`.

A secondary RAG path exists in `backend/src/analysis/context-builder.service.ts` (`buildHistoricalContext`): reviews embed a synthetic query from current activities, query Pinecone top-5, and keep only matches that have `metadata.summary` — which the backend upsert never writes, so this is effectively empty.

---

## 4. LLM Call Routing

```mermaid
flowchart LR
    subgraph callers [Callers]
        Agent["AgentService.chat"]
        Analysis["AnalysisService (daily/weekly/monthly reviews, plan generation)"]
        ChatQuery["ChatQueryService (read-only profile chat)"]
        Embeds["EmbeddingService"]
    end

    subgraph keyPools ["Key pools (llm-config.ts)"]
        ChatKeys["GOOGLE_GENERATIVE_AI_API_KEY (CSV, rotated)"]
        SyncKeys["GOOGLE_GENERATIVE_AI_SYNC_API_KEYS"]
        PlanKeys["GOOGLE_GENERATIVE_AI_PLAN_API_KEYS"]
        GroqKeys["GROQ_API_KEY"]
    end

    subgraph providers [Providers]
        GeminiChat["Gemini generateContent (default gemini-2.0-flash-lite, maxOutputTokens 2048)"]
        GeminiEmbed["gemini-embedding-001 (3072-d, REST)"]
        GroqAPI["Groq OpenAI-compatible (llama-3.1-8b-instant + fallback models, 5 retries)"]
    end

    Agent --> ChatKeys --> GeminiChat
    Agent -->|"on Gemini failure or LLM_PROVIDER=groq"| GroqKeys --> GroqAPI
    Analysis --> SyncKeys
    Analysis --> PlanKeys
    SyncKeys --> GeminiChat
    PlanKeys --> GeminiChat
    ChatQuery --> ChatKeys
    Embeds --> SyncKeys --> GeminiEmbed
```

- All calls are **non-streaming** (`generateContent`, not `streamGenerateContent`).
- Key rotation and retry loops live in `common/llm-config.ts`, `common/groq-client.ts`, and `analysis/embedding.service.ts`.
- The CLI stack (`packages/core/src/llm.ts`) instead uses the Vercel AI SDK with Anthropic / OpenAI / Google / Codex.

---

## 5. Database (MongoDB via Mongoose)

No migrations; schemas are Mongoose `@Schema` classes. Main collections and relationships:

```mermaid
erDiagram
    USERS ||--o{ ACTIVITIES : "owns"
    USERS ||--o{ RACES : "owns"
    USERS ||--o{ TRAININGPLANS : "owns"
    USERS ||--o| SUBSCRIPTIONS : "has"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ EXPENSES : "logs"
    USERS ||--o{ BIKES : "owns"
    USERS ||--o| AGENTMEMORY : "has"
    USERS ||--o{ AGENTCHATHISTORY : "has"
    USERS ||--o{ BEST_EFFORTS : "has"
    RACES ||--o| RACEPLAN : "has"
    RACES ||--o| DIETPLAN : "has"
    RACES ||--o| RACECHAT : "has"

    USERS {
        string email UK
        string passwordHash
        number ftp
        number weightKg
        string subscriptionTier
        string telegramChatId
        date lastSyncAt
    }
    ACTIVITIES {
        number stravaId
        string sport
        number distance
        object rawActivity
        object rawStreams
        string summaryText
        string vectorId
        string embeddingStatus
        object llmAnalysis
    }
    TRAININGPLANS {
        string name
        object planSkeleton
        object renderedWeeklyPlans
        string status
    }
    RACES {
        string name
        date date
        string priority
        boolean completed
    }
    AGENTCHATHISTORY {
        string userId
        string chatId UK
        array messages
    }
```

Also: `otps`, `segments`, `segment_efforts`, `best_efforts_sync_status`, `monthcontexts`, `weekcontexts`, `weeklyplans`, `modelchangerecommendations`, `paymentcards` (module not wired), `equipment`.

Explicit indexes are sparse: unique `users.email`, `subscriptions.user`, `agentchathistory {userId, chatId}`, and `notifications {user, createdAt}`. Activity queries by `{user, date}` have **no compound index**.

---

## 6. Redis / BullMQ — Current State (Mostly Scaffolding)

```mermaid
flowchart TD
    subgraph toggle ["createQueueModule(name) - common/queue/conditional-queue.ts"]
        EnvCheck{"REDIS_ENABLED !== 'false'?"}
        EnvCheck -->|yes| BullQ["BullMQ Queue (but NO BullModule.forRoot, NO Redis connection config)"]
        EnvCheck -->|"no (current .env)"| MockQ["MockQueue - in-process, serialized per queue name"]
    end

    subgraph queues [Queues]
        SyncQ["'sync' queue - registered in sync.module.ts"]
        AnalysisQ["'analysis' queue - registered in analysis.module.ts"]
        PlanQ["'plan' queue - NOT registered anywhere"]
    end

    subgraph producers [Producers]
        SyncHTTP["POST /sync/* + login hook - calls SyncService DIRECTLY, never enqueues"]
        QAA["AnalysisService.queueActivityAnalysis - add('activity', {activityId, userId})"]
        WeeklyMisnomer["queueWeeklyReview / queueMonthlyReview - actually run analyze() SYNCHRONOUSLY"]
    end

    subgraph processors ["Processor classes (exist, but not wired as Nest @Processor)"]
        SyncProc["SyncProcessor - unreachable (nothing enqueues 'sync')"]
        AnalysisProc["AnalysisProcessor - expects job.type; enqueue omits it"]
        PlanProc["PlanProcessor - orphaned stub"]
    end

    QAA --> AnalysisQ
    SyncHTTP -.->|"bypasses queue"| SyncQ
    AnalysisQ --> MockQ
    MockQ --> AnalysisProc
    SyncQ -.-> SyncProc
    PlanQ -.-> PlanProc
```

Reality check:

- **Redis is not used at runtime.** `.env` has `REDIS_ENABLED=false`, so every queue is a `MockQueue` running jobs in-process. `docker-compose.yml` starts `redis:7-alpine` but the app never reads `REDIS_HOST`/`REDIS_PORT`.
- If `REDIS_ENABLED=true` were set, jobs would enqueue to a default-localhost Redis with **no worker consuming them** (no `@Processor`/`WorkerHost` classes registered, no `BullModule.forRoot`).
- No retries, backoff, concurrency limits, dead-letter queue, or repeatable cron jobs are configured anywhere.
- Rate limiting (`ThrottlerModule`) is in-memory, not Redis-backed, so it does not survive restarts or scale across instances.

---

## 7. Environment Variables (Backend)

| Group | Variables |
| --- | --- |
| Core | `MONGODB_URI`, `PORT`, `CORS_ORIGIN`, `JWT_SECRET` |
| Queues | `REDIS_ENABLED` (no host/port vars read by code) |
| LLM (Google) | `GOOGLE_GENERATIVE_AI_API_KEY`, `GOOGLE_GENERATIVE_AI_SYNC_API_KEYS`, `GOOGLE_GENERATIVE_AI_PLAN_API_KEYS`, `GOOGLE_LLM_MODEL` |
| LLM (Groq) | `GROQ_API_KEY`, `GROQ_CHAT_MODEL`, `GROQ_FALLBACK_MODELS`, `LLM_PROVIDER` |
| Vectors | `PINECONE_API_KEY`, `PINECONE_HOST`, `PINECONE_INDEX`, `PINECONE_NAMESPACE` |
| Integrations | `STRAVA_*`, SMTP/`EMAIL_*`, `CLOUDINARY_*`, `STRIPE_SECRET_KEY`, `TELEGRAM_BOT_TOKEN`, `R2_*` (unused) |
