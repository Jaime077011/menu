# 📁 Repository Structure

> Auto-generated with `npm run docs:tree` on 2025-06-18

```
menus/
├── 📁 config
│   ├── 📁 database
│   │   └── start-database.sh
│   ├── 📁 deployment
│   │   └── vercel.json
│   └── 📁 env
├── 📁 docs
│   ├── 📁 deployment
│   │   └── DEPLOYMENT.md
│   ├── 📁 development
│   │   ├── 📁 plans
│   │   │   ├── plan-02.md
│   │   │   ├── plan.md
│   │   │   └── UI-UX-PLAN.md
│   │   ├── PROJECT_DOCUMENTATION.md
│   │   ├── PROJECT_PROGRESS.md
│   │   └── rules.md
│   └── 📁 phases
│       ├── PHASE_7_DOCUMENTATION.md
│       └── PHASE_AI_WAITER_ENHANCEMENT.md
├── 📁 prisma
│   ├── schema.prisma
│   └── seed.ts
├── 📁 public
│   ├── 📁 assets
│   │   ├── 📁 animations
│   │   │   └── 📁 rive
│   │   ├── 📁 icons
│   │   └── 📁 images
│   ├── 📁 static
│   │   └── favicon.ico
│   └── 📁 uploads
│       └── 📁 menu-items
│           ├── menu-item-1749649707589-988661555.png
│           ├── menu-item-1749649731153-33671320.png
│           ├── menu-item-1749649760321-552501423.png
│           ├── menu-item-1749649969465-364629192.png
│           ├── menu-item-1749650652563-920211853.jpg
│           ├── menu-item-1749650663072-585094405.webp
│           ├── menu-item-1749650677883-919987256.jpeg
│           ├── menu-item-1749650686692-332820705.webp
│           └── menu-item-1749650697973-821884035.jpeg
├── 📁 src
│   ├── 📁 __tests__
│   │   ├── 📁 pages
│   │   │   ├── 📁 components
│   │   │   ├── 📁 modern
│   │   │   └── 📁 phase-tests
│   │   └── 📁 unit
│   │       ├── 📁 components
│   │       ├── 📁 hooks
│   │       └── 📁 utils
│   ├── 📁 app
│   │   └── 📁 api
│   │       └── 📁 auth
│   ├── 📁 components
│   │   ├── 📁 character
│   │   │   ├── CharacterStateManager.tsx
│   │   │   └── PersonalityEngine.tsx
│   │   ├── 📁 chat
│   │   │   ├── EnhancedMessageBubble.tsx
│   │   │   └── ModernChatContainer.tsx
│   │   ├── 📁 menu
│   │   │   └── InteractiveProductCard.tsx
│   │   ├── 📁 order
│   │   │   ├── FloatingOrderSummary.tsx
│   │   │   └── RecommendationEngine.tsx
│   │   ├── 📁 rive
│   │   │   └── RiveWaiterCharacter.tsx
│   │   ├── 📁 ui
│   │   │   ├── EnhancedImageModal.tsx
│   │   │   ├── GradientButton.tsx
│   │   │   ├── LoadingStates.tsx
│   │   │   └── MicroInteractions.tsx
│   │   ├── AdminLayout.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ImageModal.tsx
│   │   ├── LoadingStates.tsx
│   │   ├── MenuGrid.tsx
│   │   ├── MenuItemCard.tsx
│   │   └── WaiterCharacter.tsx
│   ├── 📁 constants
│   │   └── index.ts
│   ├── 📁 core
│   │   ├── 📁 config
│   │   └── 📁 providers
│   ├── 📁 features
│   │   ├── 📁 admin-dashboard
│   │   │   ├── 📁 components
│   │   │   ├── 📁 hooks
│   │   │   └── 📁 types
│   │   ├── 📁 authentication
│   │   │   ├── 📁 components
│   │   │   ├── 📁 hooks
│   │   │   └── 📁 types
│   │   ├── 📁 chat-system
│   │   │   ├── 📁 components
│   │   │   ├── 📁 hooks
│   │   │   └── 📁 types
│   │   ├── 📁 menu-management
│   │   │   ├── 📁 components
│   │   │   ├── 📁 hooks
│   │   │   └── 📁 types
│   │   └── 📁 order-processing
│   │       ├── 📁 components
│   │       ├── 📁 hooks
│   │       └── 📁 types
│   ├── 📁 hooks
│   │   ├── useAccessibility.tsx
│   │   ├── usePerformance.ts
│   │   └── useResponsive.ts
│   ├── 📁 modules
│   │   └── 📁 standalone-chat
│   │       ├── 📁 pages
│   │       ├── 📁 scripts
│   │       ├── 📁 styles
│   │       └── README.md
│   ├── 📁 pages
│   │   ├── 📁 [subdomain]
│   │   │   └── index.tsx
│   │   ├── 📁 admin
│   │   │   ├── dashboard.tsx
│   │   │   ├── index.tsx
│   │   │   ├── kitchen.tsx
│   │   │   ├── login.tsx
│   │   │   ├── menu.tsx
│   │   │   ├── orders.tsx
│   │   │   ├── qr-codes.tsx
│   │   │   ├── test-multi-tenant.tsx
│   │   │   └── waiter-settings.tsx
│   │   ├── 📁 api
│   │   │   ├── 📁 admin
│   │   │   ├── 📁 auth
│   │   │   ├── 📁 trpc
│   │   │   ├── 📁 upload
│   │   │   └── health.ts
│   │   ├── 📁 super-admin
│   │   │   ├── analytics.tsx
│   │   │   ├── index.tsx
│   │   │   ├── login.tsx
│   │   │   ├── restaurants.tsx
│   │   │   └── setup.tsx
│   │   ├── _app.tsx
│   │   └── index.tsx
│   ├── 📁 server
│   │   ├── 📁 api
│   │   │   ├── 📁 routers
│   │   │   ├── root.ts
│   │   │   └── trpc.ts
│   │   └── db.ts
│   ├── 📁 shared
│   │   ├── 📁 hooks
│   │   ├── 📁 types
│   │   ├── 📁 ui
│   │   └── 📁 utils
│   ├── 📁 stores
│   │   └── characterStore.ts
│   ├── 📁 styles
│   │   └── globals.css
│   ├── 📁 types
│   │   └── index.ts
│   ├── 📁 utils
│   │   ├── 📁 __tests__
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── chatImageHelpers.ts
│   │   ├── client-tests.ts
│   │   ├── deployment.ts
│   │   ├── errorHandling.ts
│   │   ├── fallback-image.ts
│   │   ├── menuHelpers.ts
│   │   ├── menuItemDetection.ts
│   │   ├── orderParsing.ts
│   │   ├── orderProcessing.ts
│   │   ├── restaurant.ts
│   │   ├── test-multi-tenant.ts
│   │   └── validation.ts
│   ├── env.js
│   └── middleware.ts
├── 📁 tools
│   ├── 📁 docs
│   ├── 📁 generators
│   ├── 📁 scripts
│   ├── enhanced-scripts.json
│   ├── generate-tree.js
│   └── reorganize-repo.js
├── AGENT_DEVELOPMENT_GUIDE.md
├── COMPLETE_REORGANIZATION_SUMMARY.md
├── eslint.config.js
├── next.config.js
├── package-lock.json
├── package.json
├── postcss.config.js
├── prettier.config.js
├── README.md
├── REORGANIZATION_SUMMARY.md
├── REPO_TREE.md
├── tsconfig.json
└── tsconfig.tsbuildinfo
```

## 📊 Quick Stats
- **Total directories**: 96
- **Configuration files**: 79
- **Documentation files**: 15

## 🎯 Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/` | Main application source code |
| `docs/` | Project documentation |
| `config/` | Configuration files |
| `tools/` | Development tools and scripts |
| `public/` | Static assets served by the web server |
| `prisma/` | Database schema and migrations |

---

*This file is automatically updated. Do not edit manually.*
