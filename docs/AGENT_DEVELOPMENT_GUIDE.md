# 🤖 AI Agent Development Guide
## Complete Handbook for Working on the Restaurant Menu Application

---

## 🎯 **PROJECT OVERVIEW**

This is a **Next.js 14+ restaurant menu application** with advanced AI features:
- **Multi-tenant restaurant system** (subdomain-based)
- **AI waiter chat** with Rive animations 
- **Interactive menu management**
- **Real-time order processing**
- **Admin dashboard** with analytics
- **QR code generation** for tables
- **Modern UI/UX** with Tailwind CSS + Framer Motion

### Tech Stack
```
Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS
Backend: tRPC, Prisma ORM, NextAuth.js
Database: MySQL (configurable)
Animations: Rive, Framer Motion
Deployment: Vercel-ready
```

---

## 📁 **REPOSITORY STRUCTURE** (Post-Reorganization)

### 🏗️ **Core Architecture**
```
src/
├── app/                    # Next.js 13+ App Router
├── pages/                  # Pages Router (legacy support)
├── components/             # Shared UI components
├── features/               # Feature-based modules
├── shared/                 # Shared utilities
├── core/                   # Core configuration
├── types/                  # TypeScript definitions
├── constants/              # Application constants
└── modules/                # Standalone modules
```

### 🎨 **Component Organization**
```
components/
├── ui/                     # Reusable UI components
├── menu/                   # Menu-specific components
├── chat/                   # Chat system components
├── rive/                   # Rive animation components
├── order/                  # Order processing components
└── character/              # AI character components
```

### 🔧 **Feature Modules**
```
features/
├── authentication/         # Auth system
├── menu-management/        # Menu CRUD operations
├── order-processing/       # Order workflow
├── chat-system/           # AI chat functionality
└── admin-dashboard/       # Admin interface
```

---

## 🚀 **GETTING STARTED CHECKLIST**

### 1. **Environment Setup**
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Configure: DATABASE_URL, NEXTAUTH_SECRET, etc.

# Database setup
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 2. **Development Server**
```bash
# Start development server
npm run dev

# Run with database
npm run dev:with-db

# Run tests
npm run test
```

### 3. **Verify Core Features**
- ✅ Main page loads (`http://localhost:3000`)
- ✅ Admin dashboard (`http://localhost:3000/admin`)
- ✅ AI chat works (check console for Rive loading)
- ✅ Database connection established

---

## 🎯 **DEVELOPMENT BEST PRACTICES**

### 🔴 **CRITICAL RULES - NEVER BREAK THESE**

1. **File Locations Matter**
   - Static assets (images, animations) → `public/`
   - Rive files → `public/assets/animations/rive/`
   - Components → `src/components/`
   - Pages → `src/pages/` or `src/app/`

2. **Import Paths**
   - Use `@/` alias for `src/` directory
   - Example: `import Button from '@/components/ui/Button'`

3. **Database Changes**
   - Always update `prisma/schema.prisma`
   - Run `npx prisma generate` after schema changes
   - Run `npx prisma db push` to apply changes

4. **Multi-tenant Support**
   - Restaurant-specific features use `restaurantId`
   - Subdomain routing: `[subdomain]/index.tsx`
   - Test with: `restaurant1.localhost:3000`

### 🟢 **RECOMMENDED PATTERNS**

#### Component Creation
```typescript
// ✅ Good: Feature-based component
src/features/menu-management/components/MenuItemForm.tsx

// ✅ Good: Shared UI component  
src/components/ui/Button.tsx

// ❌ Avoid: Random placement
src/RandomComponent.tsx
```

#### API Routes
```typescript
// ✅ Good: tRPC router
src/server/api/routers/menu.ts

// ✅ Good: REST API for uploads
src/pages/api/upload/menu-image.ts

// ❌ Avoid: Direct database calls in components
```

#### State Management
```typescript
// ✅ Good: Zustand store
src/stores/menuStore.ts

// ✅ Good: React Query for server state
const { data } = api.menu.getAll.useQuery()

// ❌ Avoid: Global useState
```

---

## 🛠️ **COMMON DEVELOPMENT TASKS**

### 🍽️ **Adding a New Menu Feature**

1. **Create feature structure**:
```bash
src/features/new-feature/
├── components/
├── hooks/
├── types/
└── index.ts
```

2. **Add tRPC router**:
```typescript
// src/server/api/routers/newFeature.ts
export const newFeatureRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Implementation
    }),
});
```

3. **Update root router**:
```typescript
// src/server/api/root.ts
export const appRouter = createTRPCRouter({
  // ... existing routers
  newFeature: newFeatureRouter,
});
```

### 🤖 **Adding AI Chat Features**

1. **Character states** (Rive animations):
```typescript
// Available states: greeting, serving, thinking, happy, idle
character.triggerState('greeting');
```

2. **Chat responses**:
```typescript
// src/server/api/routers/chat.ts
// Add new response categories in generateResponse()
```

3. **Personality types**:
```typescript
// FRIENDLY, PROFESSIONAL, CASUAL, ENTHUSIASTIC
<RiveWaiterCharacter personality="FRIENDLY" />
```

### 🎨 **Adding UI Components**

1. **Shared components**:
```typescript
// src/components/ui/NewComponent.tsx
interface NewComponentProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}
```

2. **Feature-specific components**:
```typescript
// src/features/menu-management/components/MenuSpecificComponent.tsx
```

### 📱 **Adding New Pages**

1. **App Router** (preferred):
```typescript
// src/app/new-page/page.tsx
export default function NewPage() {
  return <div>New Page</div>;
}
```

2. **Pages Router** (legacy):
```typescript
// src/pages/new-page.tsx
export default function NewPage() {
  return <div>New Page</div>;
}
```

---

## 🐛 **TROUBLESHOOTING GUIDE**

### Common Issues & Solutions

#### 🔴 "Failed to load character" (Rive Error)
```bash
# Check file exists
ls public/assets/animations/rive/interactive_avatar.riv

# Check component path
src: '/assets/animations/rive/interactive_avatar.riv'
```

#### 🔴 Database Connection Failed
```bash
# Check environment variables
echo $DATABASE_URL

# Reset database
npx prisma db push --force-reset
npx prisma db seed
```

#### 🔴 Import Errors
```typescript
// ✅ Correct import paths
import Button from '@/components/ui/Button';
import { api } from '@/utils/api';

// ❌ Wrong paths
import Button from '../../../components/ui/Button';
```

#### 🔴 Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check TypeScript errors
npx tsc --noEmit
```

### 🔍 **Debugging Tools**

1. **Development Scripts**:
```bash
npm run dev          # Start with hot reload
npm run dev:debug    # Start with debugging
npm run test:watch   # Run tests in watch mode
npm run lint         # Check code quality
```

2. **Database Tools**:
```bash
npx prisma studio    # Visual database editor
npx prisma generate  # Regenerate client
npx prisma db seed   # Seed test data
```

---

## 📋 **TESTING STRATEGY**

### Test Organization
```
src/__tests__/
├── unit/              # Unit tests
├── components/        # Component tests  
├── pages/             # Page tests
└── phase-tests/       # Feature integration tests
```

### Writing Tests
```typescript
// Component test example
import { render, screen } from '@testing-library/react';
import MenuItemCard from '@/components/MenuItemCard';

test('renders menu item correctly', () => {
  render(<MenuItemCard item={mockMenuItem} />);
  expect(screen.getByText('Test Item')).toBeInTheDocument();
});
```

---

## 🚀 **DEPLOYMENT CHECKLIST**

### Pre-deployment
- [ ] All tests pass: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Environment variables configured
- [ ] Database migrations applied

### Vercel Deployment
- [ ] `vercel.json` configured
- [ ] Environment variables set in Vercel dashboard
- [ ] Database URL points to production
- [ ] Domain configured for multi-tenant

---

## 📚 **KEY FILES TO UNDERSTAND**

### Configuration Files
- `next.config.js` - Next.js configuration
- `prisma/schema.prisma` - Database schema
- `src/env.js` - Environment validation
- `tailwind.config.js` - Styling configuration

### Core Application Files
- `src/pages/_app.tsx` - App wrapper
- `src/server/api/root.ts` - tRPC router root
- `src/server/db.ts` - Database connection
- `src/utils/api.ts` - tRPC client setup

### Feature Entry Points
- `src/pages/[subdomain]/index.tsx` - Restaurant main page
- `src/pages/admin/dashboard.tsx` - Admin interface
- `src/components/rive/RiveWaiterCharacter.tsx` - AI character

---

## 💡 **PERFORMANCE OPTIMIZATION**

### Image Optimization
```typescript
// ✅ Use Next.js Image component
import Image from 'next/image';

<Image
  src="/uploads/menu-items/item.jpg"
  alt="Menu item"
  width={300}
  height={200}
  priority={false}
/>
```

### Code Splitting
```typescript
// ✅ Dynamic imports for heavy components
const RiveWaiterCharacter = dynamic(
  () => import('@/components/rive/RiveWaiterCharacter'),
  { ssr: false }
);
```

### Database Optimization
```typescript
// ✅ Include related data
const menuItems = await ctx.db.menuItem.findMany({
  include: { category: true, restaurant: true }
});
```

---

## 🔒 **SECURITY CONSIDERATIONS**

### Authentication
- NextAuth.js configured for admin routes
- Multi-tenant isolation by `restaurantId`
- API routes protected with middleware

### Data Validation
```typescript
// ✅ Always validate inputs with Zod
const createMenuItemSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  restaurantId: z.string().uuid(),
});
```

### File Uploads
- Images validated and resized
- Stored in `public/uploads/` with unique names
- Size limits enforced

---

## 🎉 **SUCCESS METRICS**

When you've successfully worked on this project:
- ✅ No breaking changes to existing functionality
- ✅ New features follow established patterns
- ✅ Tests pass and coverage maintained
- ✅ Performance not degraded
- ✅ Multi-tenant functionality preserved
- ✅ AI chat features working properly

---

## 📞 **GETTING HELP**

### Project Documentation
- `docs/development/PROJECT_DOCUMENTATION.md` - Detailed specs
- `docs/phases/` - Feature development phases
- `REPO_TREE.md` - Repository structure overview

### Common Commands Reference
```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run start              # Start production server

# Database
npx prisma studio          # Database GUI
npx prisma db push         # Apply schema changes
npx prisma generate        # Update Prisma client

# Testing
npm run test               # Run all tests
npm run test:watch         # Watch mode
npm run lint               # Code quality check

# Utilities
npm run clean              # Clean build artifacts
npm run setup              # Initial project setup
```

---

## 🎯 **FINAL ADVICE FOR AI AGENTS**

1. **Always read this guide first** before making changes
2. **Follow the established patterns** - don't reinvent the wheel
3. **Test your changes** - run `npm run dev` to verify
4. **Respect the multi-tenant architecture** - always include `restaurantId`
5. **Keep components small and focused** - single responsibility principle
6. **Use TypeScript properly** - leverage the existing type definitions
7. **Don't break existing functionality** - this is a production application
8. **Ask for clarification** if the requirements are unclear

**Remember**: This is a sophisticated application with many moving parts. Take time to understand the existing patterns before implementing new features. When in doubt, follow the established conventions in the codebase.

---

*Happy coding! 🚀 This application is designed to be extensible and maintainable. Follow these guidelines and you'll build features that integrate seamlessly with the existing system.* 