# 🏪 Restaurant Onboarding & Subscription Management Plan

## 📋 Overview
This plan outlines the implementation of a complete restaurant onboarding system with integrated subscription management, allowing new restaurants to sign up, choose plans, and manage their subscriptions seamlessly.

## 🎯 Goals
- **Streamlined Onboarding**: Easy restaurant registration process
- **Subscription Integration**: Seamless plan selection and payment
- **Multi-tenant Setup**: Automatic subdomain and database setup
- **Professional Experience**: Enterprise-grade onboarding flow
- **Self-Service**: Minimal manual intervention required

---

## 🏗️ Phase 1: Restaurant Registration System

### 1.1 Public Landing & Registration Pages
**Files to Create/Modify:**
- `src/pages/register.tsx` - Main registration page
- `src/pages/pricing.tsx` - Pricing plans display
- `src/pages/demo.tsx` - Demo/preview page
- `src/components/onboarding/RegistrationForm.tsx`
- `src/components/onboarding/PricingCards.tsx`
- `src/components/onboarding/FeatureComparison.tsx`

**Features:**
- Beautiful landing page with pricing tiers
- Restaurant information collection form
- Owner/admin contact details
- Business verification (optional)
- Plan selection integration
- Email verification system

### 1.2 Database Schema Updates
**Files to Modify:**
- `prisma/schema.prisma`

**New Models:**
```prisma
model RestaurantRegistration {
  id                String   @id @default(cuid())
  email             String   @unique
  restaurantName    String
  ownerName         String
  phone             String?
  address           String?
  city              String?
  state             String?
  zipCode           String?
  country           String   @default("US")
  subdomain         String   @unique
  selectedPlan      String
  status            RegistrationStatus @default(PENDING)
  verificationToken String?
  verifiedAt        DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Link to actual restaurant once approved
  restaurantId      String?  @unique
  restaurant        Restaurant? @relation(fields: [restaurantId], references: [id])
}

enum RegistrationStatus {
  PENDING
  VERIFIED
  APPROVED
  REJECTED
  COMPLETED
}
```

### 1.3 Registration API Endpoints
**Files to Create:**
- `src/pages/api/register/restaurant.ts` - Registration submission
- `src/pages/api/register/verify-email.ts` - Email verification
- `src/pages/api/register/check-subdomain.ts` - Subdomain availability
- `src/pages/api/register/resend-verification.ts` - Resend verification

---

## 🏗️ Phase 2: Subscription Integration

### 2.1 Enhanced Stripe Integration
**Files to Create/Modify:**
- `src/utils/stripe-onboarding.ts` - Onboarding-specific Stripe functions
- `src/pages/api/stripe/create-onboarding-checkout.ts`
- `src/pages/api/stripe/onboarding-webhooks.ts`

**Features:**
- Trial period setup (14-day free trial)
- Proration handling for plan changes
- Failed payment handling
- Subscription lifecycle management

### 2.2 Payment Flow Integration
**Files to Create:**
- `src/pages/checkout/[registrationId].tsx` - Checkout page
- `src/pages/checkout/success.tsx` - Success page
- `src/pages/checkout/cancel.tsx` - Cancellation page
- `src/components/onboarding/CheckoutForm.tsx`

**Flow:**
1. Restaurant registers → Registration record created
2. Email verification → Status updated to VERIFIED
3. Payment setup → Stripe checkout session
4. Payment success → Restaurant & admin account creation
5. Onboarding completion → Access granted

---

## 🏗️ Phase 3: Automated Restaurant Setup

### 3.1 Restaurant Provisioning System
**Files to Create:**
- `src/utils/restaurant-provisioning.ts`
- `src/pages/api/admin/provision-restaurant.ts`
- `src/services/SubdomainManager.ts`

**Automated Setup Process:**
1. **Database Setup**:
   - Create Restaurant record
   - Create AdminUser record
   - Set up default menu categories
   - Initialize settings with plan limits

2. **Subdomain Configuration**:
   - Validate subdomain availability
   - Configure DNS (if using custom domains)
   - Set up subdomain routing

3. **Default Content**:
   - Sample menu items
   - Default waiter personality
   - Basic restaurant settings
   - Welcome email templates

### 3.2 Onboarding Wizard
**Files to Create:**
- `src/pages/onboarding/welcome.tsx`
- `src/pages/onboarding/setup.tsx`
- `src/pages/onboarding/menu-setup.tsx`
- `src/pages/onboarding/waiter-setup.tsx`
- `src/pages/onboarding/complete.tsx`
- `src/components/onboarding/OnboardingWizard.tsx`
- `src/components/onboarding/ProgressIndicator.tsx`

**Wizard Steps:**
1. Welcome & account verification
2. Restaurant details setup
3. Basic menu configuration
4. AI waiter personality setup
5. QR code generation
6. Go-live checklist

---

## 🏗️ Phase 4: Subscription Management Dashboard

### 4.1 Enhanced Admin Subscription Pages
**Files to Enhance:**
- `src/pages/admin/subscription.tsx` - Overview with onboarding status
- `src/pages/admin/billing.tsx` - Enhanced billing with trial info
- `src/pages/admin/upgrade.tsx` - Plan change with proration

### 4.2 Super Admin Management
**Files to Create/Modify:**
- `src/pages/super-admin/registrations.tsx` - Manage pending registrations
- `src/pages/super-admin/restaurants.tsx` - Enhanced restaurant management
- `src/components/super-admin/RegistrationReview.tsx`
- `src/components/super-admin/RestaurantProvisioning.tsx`

**Features:**
- Review pending registrations
- Manual approval/rejection
- Bulk restaurant provisioning
- Subscription analytics
- Failed payment management

---

## 🏗️ Phase 5: Email & Notification System

### 5.1 Email Templates & Automation
**Files to Create:**
- `src/utils/email-templates.ts`
- `src/services/EmailService.ts`
- `src/pages/api/email/send-verification.ts`
- `src/pages/api/email/send-welcome.ts`

**Email Types:**
- Registration verification
- Welcome & setup instructions
- Payment confirmations
- Trial expiration warnings
- Subscription updates
- Failed payment notifications

### 5.2 In-App Notifications
**Files to Create:**
- `src/components/notifications/NotificationCenter.tsx`
- `src/hooks/useNotifications.ts`
- `src/utils/notification-manager.ts`

---

## 🏗️ Phase 6: Security & Validation

### 6.1 Enhanced Security
**Files to Create/Modify:**
- `src/utils/registration-validation.ts`
- `src/utils/subdomain-security.ts`
- `src/middleware/registration-rate-limit.ts`

**Security Features:**
- Rate limiting for registrations
- Email domain validation
- Subdomain sanitization
- Fraud detection basics
- CAPTCHA integration (optional)

### 6.2 Data Validation & Sanitization
- Input sanitization
- Business information validation
- Payment method verification
- Address validation (optional)

---

## 🛠️ Implementation Timeline

### Week 1-2: Foundation
- [ ] Database schema updates
- [ ] Basic registration pages
- [ ] Email verification system
- [ ] Subdomain availability checking

### Week 3-4: Payment Integration
- [ ] Stripe onboarding checkout
- [ ] Webhook handling
- [ ] Trial period setup
- [ ] Payment success/failure flows

### Week 5-6: Restaurant Provisioning
- [ ] Automated restaurant setup
- [ ] Admin account creation
- [ ] Default content generation
- [ ] Subdomain configuration

### Week 7-8: Onboarding Experience
- [ ] Onboarding wizard
- [ ] Setup completion tracking
- [ ] Welcome emails
- [ ] Go-live checklist

### Week 9-10: Management & Polish
- [ ] Super admin tools
- [ ] Enhanced subscription management
- [ ] Email automation
- [ ] Testing & bug fixes

---

## 🧪 Testing Strategy

### 6.1 Registration Flow Testing
- [ ] End-to-end registration process
- [ ] Email verification flow
- [ ] Payment processing
- [ ] Restaurant provisioning
- [ ] Onboarding wizard completion

### 6.2 Edge Cases
- [ ] Failed payments
- [ ] Duplicate registrations
- [ ] Invalid subdomains
- [ ] Email delivery failures
- [ ] Subscription changes during trial

### 6.3 Load Testing
- [ ] Concurrent registrations
- [ ] Database performance
- [ ] Email delivery at scale
- [ ] Stripe webhook handling

---

## 📊 Success Metrics

### Registration Metrics
- Registration completion rate
- Email verification rate
- Payment success rate
- Time to complete onboarding
- Trial to paid conversion rate

### Business Metrics
- Monthly recurring revenue (MRR)
- Customer acquisition cost (CAC)
- Churn rate
- Average revenue per user (ARPU)
- Support ticket volume

---

## 🔧 Technical Requirements

### Infrastructure
- Email service (SendGrid/AWS SES)
- Stripe webhook endpoints
- Subdomain routing configuration
- Database migration tools
- Monitoring & logging

### Dependencies
```json
{
  "stripe": "^14.0.0",
  "@sendgrid/mail": "^8.0.0",
  "validator": "^13.0.0",
  "zod": "^3.22.0",
  "react-hook-form": "^7.45.0",
  "framer-motion": "^10.16.0"
}
```

---

## 🚀 Future Enhancements

### Phase 7: Advanced Features
- Multi-location restaurant support
- White-label options
- API access for integrations
- Advanced analytics
- Custom domain support

### Phase 8: Enterprise Features
- SSO integration
- Advanced user management
- Custom billing cycles
- Enterprise support SLA
- Advanced security features

---

## 📝 Notes

### Important Considerations
1. **Compliance**: Ensure GDPR/CCPA compliance for data collection
2. **Scalability**: Design for high-volume registrations
3. **User Experience**: Minimize friction in onboarding
4. **Support**: Prepare support documentation and FAQs
5. **Monitoring**: Implement comprehensive logging and monitoring

### Risk Mitigation
- Backup payment processing
- Email delivery fallbacks
- Manual override capabilities
- Rollback procedures
- Data backup strategies

---

This plan provides a comprehensive roadmap for implementing a professional restaurant onboarding and subscription management system that will scale with your business needs. 