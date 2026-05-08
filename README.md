# Audio Frontend

React + Tailwind frontend for the Audio Automation platform.

## Scripts

- `npm run dev` - start local development server
- `npm run build` - production build
- `npm run lint` - TypeScript check
- `npm run test` - unit tests (Vitest)

## Environment

- `VITE_CORE_API_URL` (default: `http://localhost:8088`)
- `VITE_SILENCE_API_URL` (default: `http://localhost:8090`)

### Async audio jobs (core API)

The bot can expose **async** concatenate jobs when Postgres is configured:

1. `POST ${VITE_CORE_API_URL}/api/v1/jobs/audio/concatenate` with JSON `{ "inputDirectory": "...", "outputDirectory": "..." }`.
2. Read **`202`** response body for `id` (and optional **`X-Correlation-Id`** header for tracing).
3. Poll **`GET ${VITE_CORE_API_URL}/api/v1/jobs/{id}`** until `status` is `SUCCEEDED` or `FAILED`.

Legacy **`POST …/api/audio/concatenate`** remains synchronous.

### Job log panel (dashboard Jobs page)

`GET ${VITE_CORE_API_URL}/api/v1/job-logs?limit=50` returns recent rows from PostgreSQL `job_logs`. The SPA polls this endpoint; it does not read Firestore or the database directly.

Ensure the frontend origin is allowed by the bot’s **`CORS_ALLOWED_ORIGINS`** in production.
