# AquaAlert

Citizen-powered water leak detection and reporting platform for urban India — where any citizen can geopin a leaking pipe in 30 seconds, and municipal authorities see it live on a command-center dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/aquaalert run dev` — run the frontend (port 25475)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, Framer Motion, Wouter routing
- Maps: react-leaflet + Leaflet.js, OpenStreetMap tiles
- Charts: Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — Single source of truth for all API contracts
- `lib/db/src/schema/reports.ts` — Reports table (leaks)
- `lib/db/src/schema/users.ts` — Users table (citizens with Eco Points)
- `lib/api-client-react/src/generated/` — Generated React Query hooks
- `lib/api-zod/src/generated/` — Generated Zod validation schemas
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/aquaalert/src/pages/` — Frontend pages

## Architecture decisions

- Contract-first API design: OpenAPI spec drives codegen for both frontend hooks and backend validation schemas
- Date serialization: DB returns Date objects; routes serialize to ISO strings before Zod validation
- Analytics are computed server-side via SQL aggregates (not in application code)
- NRW (Non-Revenue Water) reduction estimate: resolved reports × 0.5 KL (configurable coefficient)
- Dark-first theme with cyan/blue accents reflecting smart city command-center aesthetic

## Product

**Citizen side:**
- Live map view showing geotagged leak pins across Mumbai, color-coded by severity
- Multi-step report submission with location picker, severity classification, description
- Report upvoting for citizen verification
- Eco Points earned per verified report

**Municipal dashboard (Command Center):**
- Real-time summary stats (total, pending, critical, resolved, NRW saved estimate)
- Severity breakdown chart and status distribution chart
- Ward-wise leak clustering table with active/critical/resolved counts
- Recent activity feed

**Report Directory:** Searchable/filterable list with severity badges, status indicators, ward, dates

**Civic Champions Leaderboard:** Ranked by Eco Points with Bronze/Silver/Gold/Platinum badges

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec changes
- DB timestamps return as Date objects — serialize with `.toISOString()` before Zod parsing
- Leaflet requires `import 'leaflet/dist/leaflet.css'` in main.tsx; fix default icon with `delete L.Icon.Default.prototype._getIconUrl`
- Frontend uses wouter for routing; base path from `import.meta.env.BASE_URL`
- Express 5: wildcard routes must use `/{*splat}`, not bare `*`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
