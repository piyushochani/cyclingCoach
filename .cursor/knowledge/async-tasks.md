# Async Task Architecture

Branch: `feat/asynchronous-tasks`

## Problem

Production had BullMQ packages but no working queue infrastructure:
- HTTP handlers blocked on long Strava syncs
- Fire-and-forget promises lost on process restart
- No per-user concurrency control or retries
- Multiple concurrent users could starve each other

## Solution

Redis-backed BullMQ with durable job tracking in MongoDB.

```
Client → POST /sync/refresh → SyncQueueService.enqueue()
                                      ↓
                               Redis (BullMQ)
                                      ↓
                               SyncWorker (concurrency: 2)
                                      ↓
                               SyncService.fullSync()
                                      ↓
                               JobStatusService.markCompleted()
                                      ↓
Client ← GET /jobs/:id ← poll until completed
```

## Queues

| Queue | Jobs | Concurrency | Retries |
|-------|------|-------------|---------|
| `sync` | `full`, `incremental`, `latest` | 2 global | 3, exponential backoff |
| `analysis` | `activity`, `weekly`, `monthly` | 3 global | 2 |
| `plan` | `ensure-plans`, `generate` | 2 global | 2 |
| `best-efforts` | `refresh` | 1 global | 3 |

## Per-user deduplication

Job IDs use pattern `{queue}:{userId}:{jobName}` so duplicate enqueue requests coalesce instead of stacking.

## Dev without Redis

Set `REDIS_ENABLED=false`. `MockQueue` runs jobs inline in the API process (same behavior as before, for local dev).

## Production setup

1. Add Redis to Railway project (Redis plugin or Upstash)
2. Set `REDIS_URL` on backend service
3. Ensure `REDIS_ENABLED` is not `false`
4. Redeploy backend — workers start with the API process

## API changes

| Endpoint | Behavior |
|----------|----------|
| `POST /sync/refresh` | Returns `{ jobId, status: 'queued' }` when Redis enabled |
| `POST /sync/incremental` | Same async pattern |
| `GET /jobs/:jobId` | Poll job status (`queued` → `active` → `completed` / `failed`) |
| `POST /best-efforts/refresh` | Enqueues instead of fire-and-forget |

Frontend `useAutoSync.ts` polls `/jobs/:id` when async response received.
