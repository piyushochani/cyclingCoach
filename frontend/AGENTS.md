<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:backend-context -->
# Backend (NestJS + MongoDB Atlas)

- **Backend** runs on `localhost:3001`, starts via `cd backend; npm run start` (uses `ts-node -r dotenv/config` — the `-r dotenv/config` preload is **required** because module-level code in `database.module.ts` reads `process.env.MONGODB_URI` before `main.ts` executes)
- **MongoDB URI**: `mongodb+srv://piyush_dev:****@cyclingai.vxey7hu.mongodb.net/cyclingai` (in `backend/.env`)
- **Seed data**: `npm run seed -w backend` or `cd backend; npm run seed` — creates 1 user, 20 activities, 4 races, 3 plans
- **`packages/core`** handles Pinecone for AI features (embeddings/RAG). Activity `_id` doubles as Pinecone vector ID.
- **Frontend** → **Backend**: `frontend/lib/api.ts` fetches from `http://localhost:3001/*` (also proxied via Next.js rewrites at `/api/*`)
- Four active endpoints: `GET /activities`, `/stats`, `/races`, `/plans` — all backed by MongoDB schemas
<!-- END:backend-context -->
