# Architecture

## Layout

```
cycling-coach/
├── backend/          NestJS API (MongoDB, BullMQ)
├── frontend/         Next.js App Router
├── packages/core/    Shared agent/compaction logic
├── packages/sport-cycling/  Prompts (SOUL, reviews)
└── .github/workflows/
```

## Auth flow

- JWT stored in `localStorage` as `cyclogenai_token`
- User profile in `cyclogenai_user`
- `frontend/lib/auth.ts` — `completeAuthSession()`, `clearAuthSession()`
- After login/signup: `triggerBackgroundSyncAfterAuth()` kicks off data load
- Global `useAutoSync()` in `ClientLayoutWrapper` — sync every 5 min

## Data refetch pattern

- `frontend/lib/useDataRefetch.ts` — re-fetches page data on `auth-session-changed`, `sync-completed`, `data-refetch`
- Pages include `refetchKey` from this hook in their fetch `useEffect` deps

## Key backend modules

| Module | Responsibility |
|--------|----------------|
| `sync` | Strava activity sync |
| `analysis` | LLM reviews, plan generation |
| `best-efforts` | Strava segment/best-effort sync |
| `training-context` | Weekly plans, workout completion |
| `agent` | Chat agent with tools |

## API proxy

`frontend/next.config.ts` rewrites `/api/*` → backend. Browser never calls Railway directly.

## Background work (pre-async branch)

- Sync: synchronous HTTP (`POST /sync/refresh`, `/sync/incremental`)
- Best-efforts: fire-and-forget in-process (`runBackgroundSync`)
- Analysis activity: MockQueue inline when `REDIS_ENABLED=false`

See [async-tasks.md](./async-tasks.md) for the target architecture on `feat/asynchronous-tasks`.
