# Menus – Comprehensive Project Documentation

## Table of Contents
1. Introduction
2. Features
3. Technology Stack
4. High-Level Architecture
5. Directory Structure
6. Database Schema
7. Environment Variables
8. Getting Started
9. Development Workflow
10. Deployment
11. API Overview (tRPC Routers)
12. Front-End Overview
13. Testing Strategy
14. Coding Standards & Conventions
15. Troubleshooting & FAQ
16. Roadmap

---

## 1. Introduction
Menus is a multi-tenant SaaS platform that lets restaurants create interactive digital menus, generate QR codes for tables, and accept orders through both a traditional UI and an AI-powered waiter chat assistant. The goal is to improve the dining experience, streamline order management, and empower restaurant owners with real-time insights.

---

## 2. Features
• Multi-restaurant support (each restaurant has its own subdomain).
• Role-based authentication: Super Admin, Restaurant Admin, Waiter/Staff, Guest.
• Digital menu with categories, dietary tags, images, and availability toggles.
• QR code generation that deep-links to a restaurant's menu/table.
• AI Waiter Chat (OpenAI) that can:
  – Answer questions about dishes.
  – Recommend items.
  – Take and confirm orders.
• Order management pipeline: Pending → Preparing → Ready → Served → Cancelled.
• Admin dashboard for CRUD operations on menu items, orders, and settings.
• Real-time UI updates via React Query & tRPC.

---

## 3. Technology Stack
• **Next.js 15** (App Router) – Full-stack React framework.
• **T3 Stack** – Opinionated combination of:
  – Next.js
  – tRPC (type-safe API layer)
  – Prisma (ORM)
  – NextAuth.js (auth)
  – Tailwind CSS (styling)
• **TypeScript** everywhere.
• **OpenAI SDK** for chat assistant.
• **MySQL** (PlanetScale / MariaDB compatible).
• **Zod** for schema validation.
• **React Query** & **Zustand** for state/data handling.
• **Framer Motion** for animations.
• **Rive** for interactive character animations (waiter avatar).

---

## 4. High-Level Architecture
```mermaid
graph TD
  subgraph Client (Browser)
    A[React UI]
    B[Zustand Store]
    C[React Query]
    A -->|tRPC| D(Next.js API Routes)
    A -->|NextAuth| D
  end

  subgraph Server (Next.js)
    D -->|tRPC Router| E[Business Logic]
    D -->|NextAuth Adapter| F[Prisma]
    E --> F
    E --> G(OpenAI API)
  end

  F -->|MySQL| H[(Database)]
```

---

## 5. Directory Structure
```text
/
├── src/
│   ├── app/            # Next.js app router (RSC)
│   ├── pages/          # (Legacy) Pages router (if any)
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── stores/         # Zustand stores
│   ├── utils/          # Helper/utility modules
│   ├── server/
│   │   ├── api/
│   │   │   ├── trpc.ts        # tRPC server & context
│   │   │   ├── root.ts        # tRPC root router
│   │   │   └── routers/
│   │   │       ├── restaurant.ts
│   │   │       ├── menu.ts
│   │   │       ├── order.ts
│   │   │       ├── chat.ts
│   │   │       └── superAdmin.ts
│   ├── styles/        # Global & component styles
│   └── middleware.ts  # Next.js middleware (auth, subdomain, etc.)
├── prisma/
│   ├── schema.prisma   # DB schema
│   └── seed.ts         # Seed script
├── public/             # Static assets
├── env.example         # Sample environment variables
├── vercel.json         # Vercel edge/function config
└── ...others (configs, docs)
```

---

## 6. Database Schema (Prisma)
| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **Restaurant** | Tenant root entity | id, name, subdomain, waiter customization |
| **AdminUser** | Restaurant-level admins | email, passwordHash, restaurantId |
| **SuperAdmin** | Global super user | role, isActive |
| **MenuItem** | Menu entries | name, description, category, price, available, imageUrl |
| **DietaryTag** | Tags per menu item | value |
| **Order** | Customer order | tableNumber, status, total |
| **OrderItem** | Junction between Order & MenuItem | quantity, priceAtTime |
| **Account / Session / VerificationToken** | NextAuth tables | ‑ |

See `prisma/schema.prisma` for full schema including enums (OrderStatus) and relations.

---

## 7. Environment Variables
Copy `.env.example` to `.env.local` and fill in values:
• `DATABASE_URL` – MySQL connection string
• `NEXTAUTH_SECRET` – Random 32+ char string
• `NEXTAUTH_URL` – e.g. https://your-domain.com
• `OPENAI_API_KEY` – OpenAI secret key
• Optional: `SENTRY_DSN`, `ANALYTICS_ID`, Discord OAuth keys, `NODE_ENV`.

---

## 8. Getting Started
1. **Clone & Install**
   ```bash
   git clone <repo> && cd menus
   npm install
   ```
2. **Configure Environment**
   ```bash
   cp env.example .env.local
   # edit .env.local
   ```
3. **Run Database** (local MySQL or Docker)
   ```bash
   # if using Docker-Compose (not included) spin up MySQL
   npm run db:generate   # runs prisma migrate dev
   npm run db:seed       # optional sample data
   ```
4. **Start Dev Server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

---

## 9. Development Workflow
| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js with Turbo dev server |
| `npm run build` | Production build |
| `npm run preview` | Build & start prod server locally |
| `npm run db:generate` | Apply latest Prisma migrations (dev) |
| `npm run db:push` | Push schema without migrations (experimental) |
| `npm run db:studio` | Launch Prisma Studio UI |
| `npm run lint` / `lint:fix` | ESLint checks |
| `npm run format:write` | Prettier formatting |
| `npm run typecheck` | TypeScript type-checking |

Hot reloading is enabled out of the box. Changes in `prisma/schema.prisma` require re-running migrate or db:push.

---

## 10. Deployment
The project is optimized for **Vercel**:
1. Add `DATABASE_URL`, `NEXTAUTH_SECRET`, `OPENAI_API_KEY` to Vercel project env.
2. Import GitHub repo; framework = Next.js.
3. Ensure **Prisma** is set to use Data Proxy or a hosted MySQL; PlanetScale is recommended.
4. PRs will generate Preview Deployments.

Docker & Netlify guides can be found in `DEPLOYMENT.md`.

---

## 11. API Overview (tRPC Routers)
| Router | Path | Key Procedures |
|--------|------|----------------|
| `restaurant` | `restaurant.*` | create, update, list, bySubdomain |
| `menu` | `menu.*` | CRUD menuItem, dietaryTags |
| `order` | `order.*` | place, updateStatus, listByRestaurant |
| `chat` | `chat.sendMessage` | Conversational endpoint integrating OpenAI to parse/confirm orders |
| `superAdmin` | `superAdmin.*` | manage restaurants, admins, stats |

Each procedure is fully type-safe and validated with **Zod**. Refer to files under `src/server/api/routers/` for field-level details.

---

## 12. Front-End Overview
• **State Management** – Local UI state with **Zustand**; server data via **React Query** auto-generated hooks (`@trpc/react-query`).
• **Styling** – Tailwind CSS with Prettier plugin for class sorting.
• **Components** – Stored in `src/components/` (e.g., `MenuGrid`, `MenuItemCard`, `WaiterCharacter`).
• **Error Handling** – `ErrorBoundary` wrapper to gracefully display runtime errors.
• **Accessibility** – Alt text for images, semantic HTML, keyboard shortcuts with `react-hotkeys-hook`.
• **Rive Animation** – Interactive waiter avatar in `components/rive/`.

---

## 13. Testing Strategy
Currently the project does not ship with automated tests. Recommended future setup:
• Unit tests – **vitest** + **@testing-library/react**.
• E2E – **Playwright** with Vercel preview URLs.
• Schema tests – Prisma migration CI check.

---

## 14. Coding Standards & Conventions
• **TypeScript strict** – no `any`, use Zod for runtime validation.
• **ESLint** – extends `eslint-config-next` & `@typescript-eslint`.
• **Prettier** – 120 char line width, Tailwind plugin.
• **Commits** – Conventional Commits (`feat:`, `fix:`, `docs:`...).
• **Branches** – `main` (prod), `dev` (integration), feature branches `feat/xyz`.

---

## 15. Troubleshooting & FAQ
| Problem | Fix |
|---------|-----|
| `PrismaClientInitializationError` | Check `DATABASE_URL` & DB connectivity |
| OpenAI rate-limit / 429 | Add billing, reduce calls, or cache responses |
| Subdomain routing fails locally | Ensure correct `HOST` header or use Vercel preview domain |

More tips in `rules.md`.

---

## 16. Roadmap
• Separate waiter personalities per table.
• Payment integration (Stripe Connect).
• Realtime order status via WebSockets (tRPC subscription).
• PWA offline mode.
• Multi-language i18n.

---

*Last updated: <!-- TODO: yyyy-mm-dd -->* 