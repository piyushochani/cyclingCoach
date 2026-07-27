# Cycling Coach — Project Knowledge

Persistent context for AI agents working in this repo.

## Quick links

| Doc | Purpose |
|-----|---------|
| [deployment.md](./deployment.md) | Production URLs, env vars, CI/CD |
| [architecture.md](./architecture.md) | Monorepo layout, auth, API patterns |
| [async-tasks.md](./async-tasks.md) | Background job queues (BullMQ + Redis) |

## Branches

| Branch | Purpose |
|--------|---------|
| `production` | Deployed to Vercel (frontend) + Railway (backend) |
| `main` | Stable mirror of production |
| `dev` | Integration branch |
| `feat/asynchronous-tasks` | BullMQ worker architecture (Redis-backed) |

## Monorepo root

All git/deploy commands run from `cycling-coach/` (not the parent `cyclingCoach/` folder).

## Production audit (Jul 2026)

**Deployed commit:** `fe9fa27` on `production`

**BullMQ status before `feat/asynchronous-tasks`:**
- Packages installed (`bullmq`, `@nestjs/bullmq`)
- Processors existed but used `MockQueue` inline execution only
- No `BullModule.forRoot` — Redis never connected
- No `@Processor` / `WorkerHost` — no real workers
- Sync ran synchronously inside HTTP handlers (blocks concurrent users)
- Best-efforts used fire-and-forget `runBackgroundSync()` (not durable)
- `REDIS_ENABLED=false` in local `.env`; no Redis service on Railway
