<div align="center">

<img src="https://img.shields.io/badge/AquaAlert-v1.0-06b6d4?style=for-the-badge&logoColor=white" />
<img src="https://img.shields.io/badge/National_Buildathon_2026-FORGE_India_%C3%97_NiharSkill-0e7490?style=for-the-badge" />
<img src="https://img.shields.io/badge/Theme-Sustainability_%26_CleanTech-16a34a?style=for-the-badge" />

<br /><br />

### *India loses **USD 1.4 billion** annually to water leakage. AquaAlert puts real-time detection in every citizen's pocket.*

**Citizen-powered water leak detection and reporting platform for urban India.**  
Any citizen. Any device. 30 seconds to pin a leak. Live on the municipal command center — instantly.

<br/>

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-aqua--alert.replit.app-06b6d4?style=for-the-badge)](https://aqua-alert--adityadubeyy97.replit.app/)
[![GitHub](https://img.shields.io/badge/GitHub-adityadubeyy87--droid/AquaAlert-181717?style=for-the-badge&logo=github)](https://github.com/adityadubeyyy87-droid/AquaAlert)

</div>

---

## 🌊 The Problem

> **40–50%** of all treated municipal water in India never reaches a tap.  
> India's urban water utilities bleed **₹11,500 crore** every year to Non-Revenue Water (NRW).  
> The root cause isn't just ageing pipes — it's the **absence of real-time ground-level data**.

Conventional leak detection relies on scheduled inspections that happen weeks after a burst. By then, thousands of litres of energy-intensive treated water are gone. Citizens see leaks every day — cracked valve chambers, gushing mains, overflowing sumps — but have no structured way to report them.

**AquaAlert bridges that gap.**

---

## 💡 The Solution

A **contract-first, full-stack civic platform** that transforms passive bystanders into active guardians of urban water infrastructure.

| For Citizens | For Municipalities |
|---|---|
| 📍 Drop a geopin on a live map | 🗺️ Live command-center heatmap |
| 🔴 Classify severity (Critical / High / Medium / Low) | 📊 Real-time analytics dashboard |
| 📝 Add description in 30 seconds | 🏙️ Ward-wise leak clustering table |
| 👍 Upvote reports for community verification | 📋 Searchable report directory |
| 🌱 Earn **Eco Points** for verified reports | 💧 NRW reduction estimate (KL saved) |
| 🏆 Climb the **Civic Champions Leaderboard** | 🔔 Activity feed for field dispatch |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CONTRACT-FIRST DESIGN                 │
│                                                         │
│   lib/api-spec/openapi.yaml  ──► Orval codegen          │
│          │                          │                   │
│          ▼                          ▼                   │
│   Zod validation schemas    React Query hooks           │
│   (backend routes)          (frontend API layer)        │
└─────────────────────────────────────────────────────────┘

┌──────────────┐     ┌───────────────┐     ┌─────────────┐
│   Frontend   │────▶│   API Server  │────▶│  PostgreSQL  │
│  React+Vite  │     │  Express 5    │     │ Drizzle ORM  │
│  Leaflet.js  │◀────│  Port 8080    │◀────│             │
│  Port 25475  │     └───────────────┘     └─────────────┘
└──────────────┘
```

**Key architectural decisions:**
- **Contract-first API** — OpenAPI spec is the single source of truth; both frontend hooks and backend validators are auto-generated via Orval
- **Server-side analytics** — All aggregates computed via SQL (not application code) for performance
- **NRW coefficient** — `resolved_reports × 0.5 KL` (configurable) directly quantifies civic impact
- **Date safety** — DB `Date` objects serialized to ISO strings before Zod parsing at route boundaries

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | pnpm workspaces |
| **Runtime** | Node.js 24 · TypeScript 5.9 |
| **Frontend** | React · Vite · TailwindCSS · Framer Motion |
| **Routing** | Wouter (base path from `import.meta.env.BASE_URL`) |
| **Maps** | react-leaflet · Leaflet.js · OpenStreetMap tiles |
| **Charts** | Recharts |
| **API** | Express 5 |
| **Database** | PostgreSQL · Drizzle ORM |
| **Validation** | Zod v4 · drizzle-zod |
| **API Codegen** | Orval (from OpenAPI spec) |
| **Build** | esbuild (CJS bundle) |

---

## 📁 Repository Structure

```
AquaAlert/
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml                    # Single source of truth for all API contracts
│   ├── db/src/schema/
│   │   ├── reports.ts                      # Reports table (leak events)
│   │   └── users.ts                        # Users table (citizens + Eco Points)
│   ├── api-client-react/src/generated/     # Generated React Query hooks
│   └── api-zod/src/generated/              # Generated Zod validation schemas
├── artifacts/
│   ├── api-server/src/routes/              # Express route handlers
│   └── aquaalert/src/pages/               # Frontend pages
├── scripts/                                # DB seeding + utility scripts
└── attached_assets/                        # Static assets
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 24+
- pnpm
- PostgreSQL (or use the auto-provisioned instance on Replit)

### Environment
```bash
DATABASE_URL=your_postgres_connection_string   # Auto-provisioned on Replit
```

### Run Locally

```bash
# Install dependencies
pnpm install

# Start API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start frontend (port 25475)
pnpm --filter @workspace/aquaalert run dev
```

### Other Commands

```bash
pnpm run typecheck                              # Full typecheck across all packages
pnpm run build                                  # Typecheck + build all packages
pnpm --filter @workspace/api-spec run codegen  # Regenerate API hooks + Zod schemas
pnpm --filter @workspace/db run push           # Push DB schema changes (dev only)
```

> ⚠️ **Always run `codegen` after any changes to `openapi.yaml`**

---

## ⚠️ Known Gotchas

```ts
// 1. Leaflet CSS must be imported in main.tsx
import 'leaflet/dist/leaflet.css'
// Fix default icon bug:
delete (L.Icon.Default.prototype as any)._getIconUrl

// 2. DB timestamps come back as Date objects — serialize before Zod
timestamp.toISOString()  // required before Zod parsing

// 3. Express 5 wildcard syntax changed
app.get('/{*splat}', handler)  // ✅ correct
app.get('/*', handler)         // ❌ breaks in Express 5

// 4. Wouter base path
import.meta.env.BASE_URL       // use this, not hardcoded '/'
```

---

## 📊 Impact Metrics

| Metric | Value |
|---|---|
| India's annual NRW loss | USD 1.4 billion |
| Average NRW in Indian cities | 40–50% of treated water |
| Report-to-pin time | < 30 seconds |
| NRW saved per resolved report | 0.5 KL (configurable) |
| Potential savings (10% NRW reduction) | Water for 12 million households |

---

## 👥 Team

| Name | Role | Institution |
|---|---|---|
| **Aditya Kr Dubey** | Full Stack · Backend · Architecture | CMR Institute of Technology, Bengaluru |
| **Aditya Hegde** | Full Stack · Frontend · UI/UX | CMR Institute of Technology, Bengaluru |

*First Year Undergraduate Students — B.E. Programme*  
*Submitted to: **National Buildathon 2026** · FORGE India × NiharSkill · Theme: Sustainability & CleanTech*

---

## 📄 License

MIT © 2026 Aditya Kr Dubey & Aditya Hegde

---

<div align="center">

*"Every dripping pipe is data waiting to be captured. AquaAlert captures it."*

**Built with 💧 for India's water future**

</div>
