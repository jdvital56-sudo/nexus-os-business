# Nexus OS Business — Universal Business Platform

## Quick Start

**Open the standalone app:**
```
open dist/index.html
```
No build step, no npm, no server needed. Works in any browser.

**Demo credentials:**
- Email: `demo@nexusos.com`
- Password: `demo1234`

## What's Included

### Standalone App (`dist/index.html`)
A complete, working Nexus OS Business application in a single HTML file (~90KB):

- **🔐 Auth System** — Login, register, JWT-like session management
- **📊 Dashboard** — Stats, quick actions, platform overview
- **🗃️ CRM** — Dynamic entities, fields, records (list/grid views, CRUD)
- **🌐 Websites** — Website management, page editor, templates
- **⚡ Automations** — Workflow automation with triggers
- **🤖 AI Bots** — Multi-channel bot configuration
- **👤 AI Agents** — Digital employees with roles and tools
- **✨ Business Generator** — AI-powered business setup (8 industries)
- **🛒 Marketplace** — Ready-made solutions catalog
- **📦 Smart Packages** — Reusable solution bundles
- **⚙️ Settings** — Profile, workspace, team, security, billing

### Architecture Docs (`ARCHITECTURE.md`)
Complete architecture document (65KB) covering:
- System architecture and design principles
- All 20+ modules with data models
- API design (REST + GraphQL)
- Plugin system, marketplace, AI layer
- Multi-tenancy, security, scaling strategy
- 24-month development roadmap

### Full-Stack Source (`src/`, `prisma/`)
Production-ready source code with:
- Next.js 15 + React 19 + TypeScript
- Prisma ORM (PostgreSQL/SQLite)
- Tailwind CSS design system
- Complete API routes (12 endpoints)
- Business Generator Engine (8 industry templates)
- Visual CRM builder with 20+ field types

## Business Generator Industries

Type any of these in the Generator:
- 🦷 Dental Clinic
- 🍽️ Restaurant
- 🛒 E-Commerce Store
- 🏋️ Fitness Club
- 🏠 Real Estate Agency
- 💆 SPA & Wellness
- ⚖️ Law Firm
- Any other business (auto-detects)

## Architecture

```
┌─────────────────────────────────────────────┐
│              CLIENT LAYER                    │
│  Web App │ Mobile │ Desktop │ API Clients    │
├─────────────────────────────────────────────┤
│              GATEWAY LAYER                   │
│  API Gateway │ Auth │ WebSocket              │
├─────────────────────────────────────────────┤
│           ORCHESTRATION LAYER                │
│  Module Registry │ Event Bus │ Plugin Mgr    │
├─────────────────────────────────────────────┤
│              CORE MODULES                    │
│  Tenancy │ IAM │ Billing │ Notifications    │
│  Files │ Audit │ Analytics │ Search          │
├─────────────────────────────────────────────┤
│            BUSINESS MODULES                  │
│  CRM │ Website │ Automation │ AI Layer       │
│  Library │ Generator │ Marketplace │ Packages│
├─────────────────────────────────────────────┤
│               DATA LAYER                     │
│  PostgreSQL │ Redis │ S3 │ ClickHouse        │
│  Meilisearch │ Vector DB                     │
└─────────────────────────────────────────────┘
```

## License

MIT
