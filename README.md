# InvoiceFlow

InvoiceFlow is a pnpm workspace monorepo with a React frontend and an Express backend. The backend deploys from `server/`, and Prisma resolves its schema from `server/prisma/schema.prisma`.

## Development

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

### Production Deployment
- **Backend (Render)**: Set the service root to `server`, then use `pnpm install --frozen-lockfile && pnpm run deploy:build` for the build command and `pnpm start` for the start command.
- **Frontend (Vercel)**: Configure environment variables in Vercel dashboard.
- Keep backend secrets such as `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `CLIENT_URL` in the Render environment.

Each platform handles its own environment variables independently for separate deployments.
