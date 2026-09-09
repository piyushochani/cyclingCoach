# Strava Sync & Data Pipeline Flow

> Sources: `backend/src/sync/`, `backend/src/analysis/activity-sync-pipeline.service.ts`, `backend/src/analysis/data-processor.service.ts`

How Strava activities are fetched, stored in MongoDB, processed, embedded, and upserted into Pinecone. Today this runs **synchronously in the HTTP request path** (or fire-and-forget after login), not via the BullMQ `sync` queue.

---

## 1. Sync Triggers

```mermaid
flowchart LR
    subgraph triggers [Sync Triggers]
        Login["POST /auth/login success"]
        Incr["POST /sync/incremental"]
        Full["POST /sync/full"]
        Latest["POST /sync/latest"]
        Analyze["POST /sync/analyze/:stravaId"]
    end

    subgraph entry [Entry Point]
        SC["SyncController"]
        SS["SyncService"]
    end

    Login -->|"fire-and-forget incrementalSync()"| SS
    Incr --> SC --> SS
    Full --> SC --> SS
    Latest --> SC --> SS
    Analyze --> SC --> SS

    SS --> IncrFlow["incrementalSync(userId)"]
    SS --> FullFlow["fullSync(userId)"]
    SS --> SingleFlow["processSingleActivity()"]
```

| Endpoint | Method | Behavior |
| --- | --- | --- |
| `POST /sync/incremental` | `incrementalSync` | Fetch activities since `user.lastSyncAt - 1h` |
| `POST /sync/full` | `fullSync` | Fetch all activities within `STRAVA_SYNC_MONTHS` window |
| `POST /sync/latest` | `syncLatest` | Fetch and process the single most recent activity |
| `POST /sync/analyze/:stravaId` | Re-process one activity by Strava ID |

Key files: `sync.controller.ts`, `sync.service.ts`, `auth.controller.ts` (login hook).

---

## 2. End-to-End Pipeline (Single Activity)

```mermaid
flowchart TB
    subgraph stravaFetch [Step 1 - Strava API Fetch]
        ListAct["GET /athlete/activities"]
        DetailAct["GET /activities/{id}"]
        Streams["GET /activities/{id}/streams"]
    end

    subgraph validate [Step 2 - Validation]
        SportCheck{"isCyclingSport?"}
        DoneCheck{"existing && embeddingStatus=done?"}
    end

    subgraph mongoWrite [Step 3 - MongoDB Persist]
        CreateOrUpdate["create or updateOne Activity"]
        Fields["rawActivity, rawStreams, polyline, embeddingStatus=pending"]
    end

    subgraph streamProc [Step 4 - Stream Processing]
        Polyline["simplifiedLatLng + polyline.encode"]
        Compact["Compact streams: power, HR, elevation, speed"]
    end

    subgraph sideEffects [Step 5 - Side Effects]
        Gear["GearService: upsert bike + addDistance"]
        Notify["NotificationService: activity synced"]
    end

    subgraph pipeline [Step 6 - ActivitySyncPipelineService]
        DP["DataProcessorService.process"]
        SB["SummaryBuilderService.build"]
        EM["EmbeddingService.embedText"]
        PC["PineconeClient.upsert"]
        MongoDone["Mongo: processed, summaryText, vectorId, embeddingStatus=done"]
    end

    subgraph postProc [Step 7 - Post Processing]
        AnalysisQ["AnalysisService.queueActivityAnalysis"]
        TrainingCtx["TrainingContextService.markWorkoutCompletedByDate"]
    end

    ListAct --> SportCheck
    SportCheck -->|no| Skip1["Skip non-cycling"]
    SportCheck -->|yes| DoneCheck
    DoneCheck -->|yes| Skip2["Skip already embedded"]
    DoneCheck -->|no| DetailAct
    DetailAct --> Streams
    Streams --> Polyline
    Polyline --> Compact
    Compact --> CreateOrUpdate
    CreateOrUpdate --> Gear
    Gear --> Notify
    Notify --> DP
    DP --> SB
    SB --> EM
    EM --> PC
    PC --> MongoDone
    MongoDone --> AnalysisQ
    AnalysisQ --> TrainingCtx
```

---

## 3. Sequence Diagram (Detailed)

```mermaid
sequenceDiagram
    autonumber
    participant Client as Frontend / Login
    participant SS as SyncService
    participant Strava as Strava API v3
    participant Mongo as MongoDB
    participant Gear as GearService
    participant Pipe as ActivitySyncPipelineService
    participant DP as DataProcessorService
    participant SB as SummaryBuilderService
    participant EM as EmbeddingService
    participant PC as PineconeClient
    participant AQ as analysis queue
    participant TC as TrainingContextService

    Client->>SS: incrementalSync(userId)
    SS->>Mongo: find User (lastSyncAt, ftp, weightKg)
    SS->>Strava: GET /athlete/activities?after=epoch
    Strava-->>SS: activity list[]

    loop each cycling activity
        SS->>Mongo: findOne {stravaId, user}
        alt already embedded
            SS-->>SS: skip
        else new or pending
            SS->>Strava: GET /activities/{id}
            SS->>Strava: GET /activities/{id}/streams
            SS->>Mongo: create/update Activity (embeddingStatus=pending)
            SS->>Gear: upsertBike / addDistance (if gear_id)
            SS->>Pipe: processActivity(payload, userId, rawActivity, rawStreams)

            Pipe->>DP: process(activity, streams, ftp, maxHr)
            Note over DP: zones, NP, IF, TSS, sessionType, terrainClass, coachingSummary
            DP-->>SB: processed metrics
            SB-->>Pipe: summaryText
            Pipe->>EM: embedText(summaryText)
            Note over EM: gemini-embedding-001, 3072-d, key rotation, 200ms throttle
            EM-->>Pipe: float[3072]
            Pipe->>PC: upsert vectorId=userId-activity_{stravaId}
            Note over PC: metadata: userId, activityId, date, sessionType, distanceKm, etc.<br/>summary text NOT in metadata (known gap)
            Pipe->>Mongo: summaryText, vectorId, processed, embeddingStatus=done

            SS->>AQ: add activity job {activityId, userId}
            SS->>TC: markWorkoutCompletedByDate(activityDate)
        end
    end

    SS->>Mongo: update User totals + lastSyncAt
    SS-->>Client: {newActivities: N}
```

---

## 4. Data Processing Detail

```mermaid
flowchart LR
    subgraph inputs [Inputs]
        RawAct["rawActivity JSON"]
        RawStr["rawStreams compact"]
        FTP["user.ftp"]
        MaxHR["user.maxHeartrate"]
    end

    subgraph processor [DataProcessorService.process]
        Zones["Power/HR zone distribution"]
        NP["Normalized Power + IF + TSS"]
        Session["Session type classifier"]
        Terrain["Terrain classifier"]
        Coach["Deterministic coachingSummary text"]
    end

    subgraph summary [SummaryBuilderService.build]
        Text["Multi-line summaryText for embedding"]
    end

    subgraph outputs [Outputs]
        MongoProc["Activity.processed"]
        MongoSum["Activity.summaryText"]
        Vector["Pinecone vector + metadata"]
    end

    RawAct --> Zones
    RawStr --> Zones
    FTP --> NP
    MaxHR --> Zones
    Zones --> Session
    Session --> Terrain
    Terrain --> Coach
    Coach --> Text
    Text --> MongoSum
    Text --> Vector
    Coach --> MongoProc
```

---

## 5. Incremental vs Full Sync

```mermaid
flowchart TD
    Start["SyncService method called"] --> Mode{"Which sync?"}

    Mode -->|incremental| Incr["afterEpoch = lastSyncAt - 3600s"]
    Mode -->|full| Full["afterEpoch = now - STRAVA_SYNC_MONTHS"]
    Mode -->|latest| Latest["fetch 1 most recent activity"]
    Mode -->|analyze| Analyze["fetch single activity by stravaId"]

    Incr --> Fetch["fetchRecentActivities(afterEpoch)"]
    Full --> Fetch
    Latest --> FetchOne["fetch + processSingleActivity"]
    Analyze --> FetchOne

    Fetch --> Loop["for each activity: processSingleActivity"]
    Loop --> UpdateUser["Update user totals: distance, movingTime, elevation, calories"]
    UpdateUser --> SetSync["user.lastSyncAt = now, isStravaUpToDate = true"]
    FetchOne --> Done["Return result"]
    SetSync --> Done
```

---

## 6. Failure Handling

```mermaid
flowchart TD
    EmbedFail["EmbeddingService throws or returns empty"] --> MarkFailed["Mongo: embeddingStatus=failed"]
    PineFail["Pinecone upsert fails"] --> MarkFailed
    StravaDetailFail["Detailed activity fetch fails"] --> UseList["Use list-level activity data, continue"]
    StreamsFail["Streams fetch fails"] --> NoStreams["Continue without streams"]
    AnalysisQueueFail["queueActivityAnalysis fails"] --> LogWarn["Log warning, activity still saved"]
    MarkFailed --> RetryGap["No automatic retry today (planned: BullMQ repeatable sweep)"]
```

---

## Key Files

| File | Role |
| --- | --- |
| `backend/src/sync/sync.controller.ts` | HTTP endpoints |
| `backend/src/sync/sync.service.ts` | Strava fetch, `processSingleActivity`, sync orchestration |
| `backend/src/analysis/activity-sync-pipeline.service.ts` | Embed + Pinecone upsert |
| `backend/src/analysis/data-processor.service.ts` | Metrics + session classification |
| `backend/src/analysis/summary-builder.service.ts` | Text for embedding |
| `backend/src/analysis/embedding.service.ts` | Gemini embedding API |
| `backend/src/analysis/pinecone-client.ts` | Vector upsert/query/delete |
| `backend/src/analysis/analysis.service.ts` | `queueActivityAnalysis` → LLM analysis job |
