# Restaurant Subscription Plan - Menus Platform
## Strategic Monetization & Feature Tiering Plan

**Document Version:** 1.0  
**Created:** January 2025  
**Project:** AI-Powered Restaurant Menu Management System  

---

## 📋 Executive Summary

This document outlines a comprehensive subscription strategy for the Menus platform, transforming it from a basic SaaS into a tiered subscription service with multiple pricing plans tailored to different restaurant types and needs.

### Current Platform Capabilities
- ✅ Multi-tenant restaurant management
- ✅ AI-powered virtual waiter with OpenAI integration
- ✅ Advanced order management system
- ✅ QR code generation and customer interface
- ✅ Real-time kitchen dashboard
- ✅ Comprehensive admin controls
- ✅ Super admin platform management
- ✅ Rive character animations
- ✅ Performance analytics and monitoring

---

## 💰 Subscription Tiers

### 🥉 **STARTER PLAN** - $29/month
**Perfect for small cafes, food trucks, and single-location restaurants**

#### Core Features
- ✅ **1 Restaurant Location**
- ✅ **Up to 50 Menu Items**
- ✅ **Basic AI Waiter** (Standard personality)
- ✅ **QR Code Ordering**
- ✅ **Order Management** (Basic kitchen dashboard)
- ✅ **Customer Support** (Email only)
- ✅ **Basic Analytics** (Order count, revenue)
- ✅ **Standard Themes** (3 color schemes)

#### Limitations
- ❌ No custom AI personality
- ❌ No advanced analytics
- ❌ No integrations
- ❌ No priority support
- ❌ No custom branding

---

### 🥈 **PROFESSIONAL PLAN** - $79/month
**Ideal for growing restaurants and small chains**

#### Core Features (All Starter +)
- ✅ **Up to 3 Restaurant Locations**
- ✅ **Up to 200 Menu Items per location**
- ✅ **Advanced AI Waiter** (Custom personality, specialized knowledge)
- ✅ **Custom Welcome Messages**
- ✅ **Advanced Order Management** (Status tracking, preparation times)
- ✅ **Customer Analytics** (Peak hours, popular items)
- ✅ **Email & Phone Support**
- ✅ **Custom Branding** (Logo, colors, fonts)
- ✅ **Menu Categories & Dietary Tags**
- ✅ **Inventory Alerts** (Low stock notifications)

#### New Features
- 🆕 **Multi-Location Management**
- 🆕 **Staff Management** (Multiple admin users)
- 🆕 **Advanced Reporting** (Weekly/Monthly reports)
- 🆕 **Integration Ready** (Basic webhook support)

---

### 🥇 **ENTERPRISE PLAN** - $199/month
**For restaurant chains and high-volume establishments**

#### Core Features (All Professional +)
- ✅ **Unlimited Restaurant Locations**
- ✅ **Unlimited Menu Items**
- ✅ **AI Waiter Pro** (Multiple personalities, advanced context)
- ✅ **White-Label Solution** (Custom domain, full branding)
- ✅ **Advanced Analytics Suite** (Predictive analytics, customer insights)
- ✅ **Priority Support** (24/7 phone + dedicated account manager)
- ✅ **API Access** (Full REST API)
- ✅ **Custom Integrations** (POS systems, payment gateways)

#### Enterprise Features
- 🆕 **Multi-Tenant Management** (Franchise support)
- 🆕 **Advanced Security** (SSO, audit logs)
- 🆕 **Custom Development** (Bespoke features)
- 🆕 **Performance SLA** (99.9% uptime guarantee)
- 🆕 **Data Export** (Full data ownership)
- 🆕 **Training & Onboarding** (Dedicated success manager)

---

### 💎 **CUSTOM ENTERPRISE** - Contact Sales
**For large chains, franchises, and special requirements**

#### Bespoke Solutions
- 🎯 **Custom Pricing** (Volume discounts)
- 🎯 **Dedicated Infrastructure** (Private cloud deployment)
- 🎯 **Custom Features** (Built to specification)
- 🎯 **Integration Services** (Professional implementation)
- 🎯 **24/7 Support** (Dedicated technical team)
- 🎯 **SLA Guarantees** (99.99% uptime)

---

## 🛠 Technical Implementation Plan

### Phase 1: Database Schema Updates (2 weeks)

#### New Tables Required

```sql
-- Subscription Plans
CREATE TABLE SubscriptionPlans (
  id VARCHAR(191) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  billingInterval ENUM('MONTHLY', 'YEARLY') DEFAULT 'MONTHLY',
  maxLocations INT DEFAULT 1,
  maxMenuItems INT DEFAULT 50,
  features JSON, -- Feature flags as JSON
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Restaurant Subscriptions
CREATE TABLE RestaurantSubscriptions (
  id VARCHAR(191) PRIMARY KEY,
  restaurantId VARCHAR(191) NOT NULL,
  planId VARCHAR(191) NOT NULL,
  status ENUM('ACTIVE', 'CANCELLED', 'PAST_DUE', 'TRIAL') DEFAULT 'TRIAL',
  currentPeriodStart DATETIME NOT NULL,
  currentPeriodEnd DATETIME NOT NULL,
  trialEnd DATETIME,
  stripeSubscriptionId VARCHAR(255),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurantId) REFERENCES Restaurant(id),
  FOREIGN KEY (planId) REFERENCES SubscriptionPlans(id)
);

-- Usage Tracking
CREATE TABLE UsageMetrics (
  id VARCHAR(191) PRIMARY KEY,
  restaurantId VARCHAR(191) NOT NULL,
  metricType ENUM('ORDERS', 'MENU_ITEMS', 'API_CALLS') NOT NULL,
  value INT NOT NULL,
  recordedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurantId) REFERENCES Restaurant(id)
);

-- Feature Flags
CREATE TABLE RestaurantFeatures (
  id VARCHAR(191) PRIMARY KEY,
  restaurantId VARCHAR(191) NOT NULL,
  featureName VARCHAR(100) NOT NULL,
  isEnabled BOOLEAN DEFAULT false,
  expiresAt DATETIME,
  FOREIGN KEY (restaurantId) REFERENCES Restaurant(id)
);
```

#### Updated Restaurant Schema

```sql
-- Add subscription fields to Restaurant table
ALTER TABLE Restaurant ADD COLUMN subscriptionId VARCHAR(191);
ALTER TABLE Restaurant ADD COLUMN subscriptionStatus ENUM('ACTIVE', 'TRIAL', 'CANCELLED') DEFAULT 'TRIAL';
ALTER TABLE Restaurant ADD COLUMN trialEndsAt DATETIME DEFAULT (DATE_ADD(NOW(), INTERVAL 14 DAY));
```

### Phase 2: Subscription Management System (3 weeks)

#### New tRPC Routers

```typescript
// src/server/api/routers/subscription.ts
export const subscriptionRouter = createTRPCRouter({
  // Get available plans
  getPlans: publicProcedure.query(),
  
  // Get current subscription
  getCurrentSubscription: protectedProcedure.query(),
  
  // Subscribe to plan
  subscribe: protectedProcedure
    .input(z.object({ planId: z.string() }))
    .mutation(),
    
  // Cancel subscription
  cancel: protectedProcedure.mutation(),
  
  // Update subscription
  changePlan: protectedProcedure
    .input(z.object({ newPlanId: z.string() }))
    .mutation(),
    
  // Get usage metrics
  getUsage: protectedProcedure.query(),
});
```

#### Feature Gating System

```typescript
// src/utils/featureGating.ts
export class FeatureGate {
  static async checkFeature(
    restaurantId: string, 
    feature: string
  ): Promise<boolean> {
    // Check subscription plan and feature availability
  }
  
  static async enforceLimit(
    restaurantId: string,
    limitType: 'MENU_ITEMS' | 'LOCATIONS',
    currentCount: number
  ): Promise<boolean> {
    // Enforce subscription limits
  }
}
```

### Phase 3: Payment Integration (2 weeks)

#### Stripe Integration

```typescript
// src/utils/stripe.ts
export class StripeManager {
  static async createSubscription(
    customerId: string,
    priceId: string
  ): Promise<Stripe.Subscription> {
    // Create Stripe subscription
  }
  
  static async handleWebhook(
    event: Stripe.Event
  ): Promise<void> {
    // Handle subscription updates
  }
}
```

#### Payment Pages
- `/admin/billing` - Subscription management
- `/admin/upgrade` - Plan comparison and upgrade
- `/admin/payment-methods` - Payment method management

### Phase 4: UI/UX Implementation (3 weeks)

#### New Admin Pages
1. **Billing Dashboard** (`/admin/billing`)
2. **Plan Upgrade** (`/admin/upgrade`) 
3. **Usage Analytics** (`/admin/usage`)
4. **Feature Settings** (`/admin/features`)

#### Feature Limitation UI
- Menu item limit warnings
- Location limit enforcement
- Feature unavailable modals
- Upgrade prompts

---

## 📊 Pricing Strategy Analysis

### Market Research
- **Toast POS**: $69-165/month
- **Square for Restaurants**: $60-165/month  
- **Resy**: $189-399/month
- **OpenTable**: $249-449/month

### Our Competitive Advantage
- 🤖 **AI-First Approach** (Unique selling point)
- 💰 **Lower Entry Price** ($29 vs competitors' $60+)
- 🚀 **Modern Tech Stack** (Better performance)
- 🎨 **Beautiful UI/UX** (Superior user experience)

### Revenue Projections

| Plan | Monthly Price | Target Customers | Year 1 Goal | Monthly Revenue |
|------|---------------|------------------|-------------|-----------------|
| Starter | $29 | 500 restaurants | $14,500 |
| Professional | $79 | 200 restaurants | $15,800 |
| Enterprise | $199 | 50 restaurants | $9,950 |
| **Total** | | **750 customers** | **$40,250/month** |

**Annual Revenue Target: $483,000**

---

## 🎯 Feature Differentiation Matrix

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| Restaurant Locations | 1 | 3 | Unlimited |
| Menu Items | 50 | 200 | Unlimited |
| AI Personality | Basic | Custom | Multiple |
| Analytics | Basic | Advanced | Predictive |
| Support | Email | Phone + Email | 24/7 + Manager |
| Branding | None | Custom | White-label |
| API Access | ❌ | Basic | Full |
| Integrations | ❌ | Webhooks | Custom |
| Multi-Admin | ❌ | ✅ | ✅ |
| Advanced Reports | ❌ | ✅ | ✅ |
| Priority Features | ❌ | ❌ | ✅ |

---

## 🚀 Go-to-Market Strategy

### Phase 1: Foundation (Month 1-2)
- ✅ Implement subscription system
- ✅ Create billing infrastructure  
- ✅ Build upgrade/downgrade flows
- ✅ Set up Stripe integration

### Phase 2: Beta Launch (Month 3)
- 🧪 **Beta Program** (50 select restaurants)
- 🎁 **Free 30-day trial** for all plans
- 📧 **Email marketing** to existing users
- 💬 **Feedback collection** and iteration

### Phase 3: Public Launch (Month 4)
- 📢 **Public announcement** 
- 🎯 **Targeted advertising** (Google Ads, Facebook)
- 🤝 **Partnership outreach** (Restaurant associations)
- 📱 **Content marketing** (Blog, case studies)

### Phase 4: Scale (Month 5-12)
- 🔄 **Referral program** (1 month free for referrals)
- 🏆 **Success stories** and testimonials
- 🌍 **Geographic expansion**
- 🚀 **Feature expansion** based on feedback

---

## 📈 Success Metrics & KPIs

### Financial Metrics
- **Monthly Recurring Revenue (MRR)**
- **Annual Recurring Revenue (ARR)**
- **Customer Acquisition Cost (CAC)**
- **Lifetime Value (LTV)**
- **Churn Rate** (Target: <5% monthly)

### Product Metrics
- **Trial to Paid Conversion** (Target: >15%)
- **Feature Adoption Rates**
- **Support Ticket Volume**
- **User Satisfaction Score** (Target: >4.5/5)

### Growth Metrics
- **New Signups per Month**
- **Upgrade Rate** (Starter → Professional)
- **Referral Rate**
- **Market Penetration**

---

## 🔒 Risk Assessment & Mitigation

### Technical Risks
- **Risk**: Payment processing failures
- **Mitigation**: Robust error handling, backup payment methods

- **Risk**: Feature gating bugs
- **Mitigation**: Comprehensive testing, gradual rollout

### Business Risks
- **Risk**: Customer churn due to pricing
- **Mitigation**: Grandfathering, migration assistance

- **Risk**: Competitor response
- **Mitigation**: Continuous innovation, customer lock-in

### Operational Risks
- **Risk**: Support volume increase
- **Mitigation**: Self-service resources, tiered support

---

## 🛣️ Implementation Timeline

### Month 1: Foundation
- Week 1-2: Database schema updates
- Week 3-4: Basic subscription system

### Month 2: Core Features  
- Week 1-2: Payment integration
- Week 3-4: Feature gating system

### Month 3: UI/UX
- Week 1-2: Admin billing pages
- Week 3-4: Upgrade flows and limits

### Month 4: Beta & Testing
- Week 1-2: Beta program launch
- Week 3-4: Feedback integration

### Month 5: Public Launch
- Week 1-2: Marketing campaign
- Week 3-4: Scale and optimize

---

## 💡 Future Enhancements

### Advanced Features (Phase 2)
- 🤖 **AI Menu Optimization** (Suggest pricing, items)
- 📊 **Predictive Analytics** (Demand forecasting)
- 🔗 **POS Integrations** (Toast, Square, Clover)
- 📱 **Mobile App** (Manager dashboard)
- 🌐 **Multi-language Support**

### Enterprise Features (Phase 3)
- 🏢 **Franchise Management** (Multi-brand support)
- 📈 **Advanced BI Dashboard** (Executive reporting)
- 🔐 **SSO Integration** (Enterprise authentication)
- ☁️ **Private Cloud Deployment**
- 🎓 **Training Platform** (Staff onboarding)

---

## 📞 Next Steps

### Immediate Actions (This Week)
1. **Stakeholder Review** - Present plan to team
2. **Technical Planning** - Detailed implementation specs
3. **Design Mockups** - UI/UX for billing pages
4. **Legal Review** - Terms of service updates

### Short-term (Next Month)
1. **Database Migration** - Schema updates
2. **Stripe Setup** - Payment infrastructure
3. **Feature Gating** - Core limitation system
4. **Beta Preparation** - Testing environment

### Long-term (Next Quarter)
1. **Beta Launch** - 50 restaurant pilot
2. **Marketing Preparation** - Content and campaigns
3. **Support Training** - Team preparation
4. **Public Launch** - Full market release

---

**Document Status:** ✅ Ready for Review  
**Next Review Date:** February 15, 2025  
**Owner:** Product Team  
**Stakeholders:** Engineering, Marketing, Sales, Support
