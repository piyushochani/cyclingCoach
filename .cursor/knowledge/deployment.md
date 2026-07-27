# Deployment

## URLs

| Service | URL |
|---------|-----|
| Frontend (prod) | https://cycling-coach-rho.vercel.app |
| Backend (prod) | https://cyclogenai-backend-production.up.railway.app |
| Health check | `GET /health` → `{ "ok": true }` |

## Platforms

### Frontend — Vercel
- Project: `cycling-coach`
- Root directory: `frontend`
- Deploy from monorepo root (`cycling-coach/`)
- Env: `NEXT_PUBLIC_API_URL` → Railway backend URL
- Browser API calls use `/api` rewrite (see `frontend/lib/api.ts`) to avoid CORS

### Backend — Railway
- Project: `cyclogenai-backend`
- Service linked from `backend/` directory
- Build: Dockerfile (multi-stage production build)
- Domain port must match `PORT` env (8080 on Railway, not 3001)
- Config: `backend/railway.toml`

## CI/CD

`.github/workflows/deploy.yml` — runs on push to `main` or `production`:
1. Test + build (pnpm)
2. Deploy backend via Railway CLI
3. Deploy frontend via Vercel CLI

Required GitHub secrets: `RAILWAY_TOKEN`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

## Required env vars (backend)

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection |
| `JWT_SECRET` | Auth tokens |
| `CORS_ORIGIN` | Comma-separated allowed origins |
| `STRAVA_CLIENT_ID` / `STRAVA_CLIENT_SECRET` | Strava OAuth |
| `REDIS_URL` or `REDIS_HOST`+`REDIS_PORT` | BullMQ (required for async tasks in prod) |
| `REDIS_ENABLED` | Set `false` for local dev without Redis |

## Local dev

```bash
docker compose up -d redis mongodb   # from cycling-coach/
cd backend && REDIS_ENABLED=true pnpm start:dev
cd frontend && pnpm dev
```
