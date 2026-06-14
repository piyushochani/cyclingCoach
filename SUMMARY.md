# CyclogenAI Development Summary

## Goal
Build a complete training-planning architecture for CyclogenAI, fix LLM quota/key exhaustion, show only real notifications from backend, and unify all chat interfaces behind a single backend agent.

## Constraints & Preferences
- The day user first syncs = Week 0; past weeks have negative indexing (-1, -2, etc.)
- "Start Free" buttons must clear previous session before navigating to /signup
- StravaConnectOverlay must not block users who have previously synced
- Auth URL fetch failures must show user-friendly messages, not debug text
- readStravaConfig() must fall back to env vars after config file search before throwing
- onboardingSummary stored on User model and passed to every LLM call
- HR zones: 6-zone model (Z1 <55%, Z2 55-69%, Z3 70-79%, Z4 80-87%, Z5 88-94%, Z6 ≥95%)
- All distances in meters from Strava divided by 1000 for display
- Auto-sync interval 2 hours, toggleable via UI
- Landing page navbar: permanently black, fixed, no pricing dropdown, pt-20
- Signup: OTP + name + password only; advanced fields in Strava callback
- Onboarding chat: 5 guided questions saved to onboardingSummary
- Best-efforts page: dynamic distance tabs, top 5 per category, "Show All" dropdown
- Calendar: relative week navigation, no +Next Week button, nav above title
- LLM callLLM: stops retrying on 429, falls back to flash-lite once
- Both Telegram + web chat must use the same backend agent (no independent Telegram LLM)
- API keys split: chat pool (5 keys, project `bike-computer-c128f`) vs sync pool (keys from `gen-lang-client-0471745669`) — separate Google Cloud project quotas
- Model used: `gemini-2.0-flash-lite` across all services
- Gemini keys are free tier — 1,500 requests/day per project; function calling requires unrestricted key

## Progress
### Done
- **Fixed `incrementalSync` corruption**: Restored proper logic (was replaced with `fullSync` tail by mistake during notification integration). Now has full activity processing loop (fetch → find existing → processSingleActivity → update user metrics → save → notification on completion)
- **Backend compiles clean**: Fixed `MongooseSchema` import in notification schema; all 3 packages compile (backend tsc --noEmit, packages/core tsc --noEmit, frontend next build)
- **Frontend notifications page**: Rewired from seed data to `GET /notifications` API; pinned "Activities Pending Sync" banner with auto-sync toggle + "Sync Now" button, polls sync status every 30s
- **Notifications module (backend)**: `Notification` schema (type, title, message, read, metadata), `NotificationService` with create/findByUser/markRead/markAllRead/getUnreadCount + convenience methods (createActivitySynced, createBestEffortNotification, createSyncCompleteNotification, createRaceReminder), `NotificationController` (GET /notifications, POST /:id/read, POST /read-all, GET /unread-count), `NotificationModule` — registered in AppModule
- **Sync → notifications hook**: `SyncService` injects `NotificationService`; creates `createSyncCompleteNotification` after fullSync, `createActivitySynced` per new activity in processSingleActivity; incrementalSync also sends notification
- **FirstSyncTutorial**: Removed from Dashboard — now renders on Strava callback page as non-skippable overlay after sync completes, before profile form; `onDismiss` callback added; only shows once (localStorage persistence)
- **Chart width(-1) height(-1) fix**: `minWidth={0}` added to all 13 `ResponsiveContainer` instances across 7 files
- **API key split into chat/sync pools**: `GOOGLE_GENERATIVE_AI_API_KEY` (chat pool, 1 key from `bike-computer-c128f` project) and `GOOGLE_GENERATIVE_AI_SYNC_API_KEYS` (sync pool, 4 keys from `gen-lang-client-0471745669`)
- **Agent key rotation**: `callGemini()` round-robins all chat keys on 429; `loadApiKeys()` properly splits comma-separated keys
- **Mongoose `findOneAndUpdate` deprecation**: All `{ new: true }` → `{ returnDocument: 'after' }` across 9 service files
- **Model switched to flash-lite**: `gemini-2.0-flash-lite` in all services + config
- **Past items still done**: AgentModule, Telegram thin relay, unified chat, user isolation, StravaConnectOverlay fixes, connect page, landing Start Free, week indexing, onboarding summary + chat, signup/login, calendar, best-efforts, UI standardization, stripe integration

### In Progress
- (none)

### Blocked
- Google Cloud free-tier quota (1,500 requests/day per project) for `gen-lang-client-0471745669`; `bike-computer-c128f` key isolated in chat pool

## Next Steps
1. Test chatbot with `bike-computer-c128f` chat pool key (fresh 1,500/day quota)
2. Add race reminder notifications (check upcoming races during sync)
3. Add best-effort PR notifications (check against previous bests during sync)
4. Enable billing on one Google Cloud project to remove the 1,500/day cap

## Critical Context
- STRAVA_CLIENT_ID=245973 in backend/.env and ~/.cycling-coach/config.yaml
- Strava OAuth redirect_uri: http://localhost:3000/auth/strava/callback (hardcoded)
- Gemini keys are free tier — **separate projects**: chat key belongs to `bike-computer-c128f`, sync keys belong to `gen-lang-client-0471745669`
- `gemini-2.0-flash-lite` used across all services (agent, analysis, chat-query); free tier 30,000 RPM
- `GOOGLE_GENERATIVE_AI_API_KEY` = chat pool (1 key, project `bike-computer-c128f`)
- `GOOGLE_GENERATIVE_AI_SYNC_API_KEYS` = sync pool (4 keys, project `gen-lang-client-0471745669`)
- Both embedding & content generation use separate key pools by design
- The agent uses raw `fetch` to Gemini API (no AI SDK) — avoids ESM/CJS issues since backend uses CommonJS
- All three packages compile cleanly: backend (tsc --noEmit ✅), packages/core (tsc --noEmit ✅), frontend (next build ✅)
