# InvoiceFlow

![CI](https://github.com/karansaini46/InvoiceFlow/workflows/CI/badge.svg)

InvoiceFlow is a pnpm workspace monorepo with a React frontend and an Express backend. The backend deploys from `server/`, and Prisma resolves its schema from `server/prisma/schema.prisma`.

## Development

Use Node.js `22.22.0`. The repo includes `.node-version` and `.nvmrc` so local tooling and Render can pick the same runtime.

```bash
pnpm install
pnpm dev
```

The client runs on `http://localhost:5173` and the server runs on `http://localhost:3000`.

## Environment Setup

### Local Development
- Server environment variables: `server/.env`
- Client environment variables: `client/.env` (if needed)
- The server expects a PostgreSQL `DATABASE_URL`, not a SQLite file path.
- Use a separate PostgreSQL database for `TEST_DATABASE_URL`; the test suite is destructive and refuses to run unless it is explicitly pointed at an isolated test database.

### Production Deployment
- **Backend (Render)**: Set the service root to `server`, then use `npm install && npm run deploy:build` for the build command and `npm start` for the start command.
- **Frontend (Vercel)**: Configure environment variables in Vercel dashboard.
- Keep backend secrets such as `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` in the Render environment.
- To enable the AI assistant, also set `NVIDIA_API_KEY`, `NVIDIA_BASE_URL`, `LLAMA_MODEL`, `AI_RATE_LIMIT_WINDOW_MS`, `AI_RATE_LIMIT_MAX_REQUESTS`, and `AI_MAX_CONCURRENT_REQUESTS` in the backend environment.
- Set `CLIENT_URLS` to the allowed frontend origins, for example `https://invoice-flow-client.vercel.app`.

Each platform handles its own environment variables independently for separate deployments.
