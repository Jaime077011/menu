# Agent Rules for AI-Powered Restaurant Menu Assistant

## 🎯 Project Overview
You are helping build a multi-tenant restaurant assistant app where users scan a QR code to access an AI-powered virtual waiter that recommends dishes and takes orders conversationally. Each restaurant has its own dashboard and menu. Orders go to a kitchen dashboard with live updates.

## 💻 Tech Stack (ACTUAL)

**Frontend & Backend:**
- **Next.js** (Pages Router) with TypeScript
- **T3 Stack**: tRPC + Prisma + NextAuth + TypeScript
- **Tailwind CSS v4**
- **MySQL** database
- **Prisma ORM** v6.5.0
- **NextAuth v5 beta** (currently with Discord provider)
- **tRPC v11** for type-safe API calls
- **Zod** for schema validation
- **React Query** (@tanstack/react-query) for data fetching

**Deployment Options:**
- Vercel for hosting (Next.js optimized)
- PlanetScale/Railway for MySQL database
- Environment variables for secrets

---

## 🛠️ Coding Conventions

- Use **TypeScript** throughout the project (already configured)
- Use **tRPC procedures** instead of REST API routes
- Use **Prisma Client** for all database operations
- Use **Zod schemas** for input validation in tRPC
- Follow **T3 Stack conventions** and patterns
- Use **functional components and hooks** in React
- Prefer `async/await` over `.then()`
- Always ensure `restaurantId` is scoped properly for multi-tenancy
- Use `getServerSideProps` or tRPC for server-side data fetching

---

## 📦 Folder Structure (ACTUAL)

```
src/
├── pages/           ← Next.js pages (Pages Router)
│   ├── api/         ← Next.js API routes (if needed)
│   ├── admin/       ← Admin dashboard pages
│   └── [subdomain]/ ← Customer chat interface
├── server/
│   ├── api/
│   │   ├── routers/ ← tRPC procedure routers
│   │   ├── trpc.ts  ← tRPC configuration
│   │   └── root.ts  ← Main app router
│   ├── auth/        ← NextAuth configuration
│   └── db.ts        ← Prisma client instance
├── utils/           ← Shared utilities
├── styles/          ← Global styles
└── env.js           ← Environment validation
prisma/
└── schema.prisma    ← Database schema
```

---

## 📋 Development Process

You must work in **small, clear steps** with testable outcomes. Do not skip ahead.

### 1. Understand the task
Ask for clarification if a spec is vague or underspecified.

### 2. Check architecture rules
Make sure the implementation fits the T3 Stack patterns and multi-tenant architecture.

### 3. Implement using T3 patterns
- Create tRPC routers for API logic
- Use Prisma for database operations
- Implement proper TypeScript types
- Use Zod for validation

### 4. Test with development tools
- Use `npm run dev` for development
- Use `npm run db:studio` for database inspection
- Test tRPC procedures through the frontend

---

## ✅ MVP Scope (Follow This!)

The MVP ends at:

- Admin can login and manage restaurant menu
- AI can respond to chat input with personalized menu suggestions
- Orders are created via tRPC procedures
- Kitchen dashboard shows real-time order updates

🛑 **Do not build**: payments, loyalty programs, voice features, or customer user accounts.

---

## 🔐 Security & Auth (ACTUAL SETUP)

**Current Auth Setup:**
- NextAuth v5 beta with Discord provider
- Prisma adapter for session storage
- Session-based authentication

**For Admin Auth:**
- Add credentials provider to NextAuth
- Use `AdminUser` model for restaurant admin login
- Protect admin routes with `getServerSession`
- Ensure restaurant scoping in all admin operations

---

## 🧠 AI Integration Rules

- AI prompt should include: menu data, restaurant name, table number
- Role-play the assistant as a friendly waiter
- Detect order intent and extract items + quantity + table number
- Use tRPC procedures to place orders
- Be concise and guide the user step-by-step in the conversation

---

## 🛡️ Database Models (ACTUAL)

Current Prisma schema includes:
- `Restaurant` (with subdomain for multi-tenancy)
- `AdminUser` (restaurant admin accounts)
- `MenuItem` (with dietary tags)
- `Order` & `OrderItem` (with status enum)
- NextAuth models (`User`, `Account`, `Session`)

---

## 🧪 Testing & Debugging

- Use `npm run dev` for development server
- Use `npm run db:studio` for Prisma Studio
- Use `npm run db:push` for schema changes
- Test tRPC procedures in browser dev tools
- Use React Query dev tools for cache inspection

---

## 🧩 T3 Stack Patterns

- **tRPC Routers**: Organize procedures by domain (menu, orders, auth)
- **Input Validation**: Use Zod schemas in tRPC procedures
- **Database Access**: Always use Prisma client from `@/server/db`
- **Type Safety**: Leverage tRPC's end-to-end type safety
- **Error Handling**: Use tRPC error codes and proper error boundaries

---

## 🙅 Don'ts

- Don't create REST API routes when tRPC procedures work better
- Don't hardcode restaurant data
- Don't skip TypeScript type annotations
- Don't use inline styles in JSX — use Tailwind
- Don't put AI prompt logic inside UI components
- Don't bypass tRPC for data fetching from frontend

---

## ✅ Ready-To-Go Tasks

You can ask me to start on any of these:
- Setup admin auth with NextAuth credentials provider
- Create admin dashboard pages with proper routing
- Build menu CRUD tRPC procedures and UI
- Implement chat tRPC procedure with AI integration
- Create order parsing and submission logic
- Set up kitchen dashboard with real-time updates
- Add proper restaurant multi-tenancy

---

## 🧭 Default Goals

- Follow T3 Stack conventions and patterns
- Maintain end-to-end type safety with tRPC
- Keep multi-tenant architecture secure
- Prioritize developer experience and maintainability
- Use Prisma for all database operations
- Validate all inputs with Zod schemas



