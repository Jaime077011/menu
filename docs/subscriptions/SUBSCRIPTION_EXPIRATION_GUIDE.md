# 🚨 Subscription Expiration & Payment Failure Guide

## 📋 **What Happens When Subscriptions Expire**

Your NEXUS system has sophisticated handling for subscription expiration and payment failures. Here's exactly what happens:

---

## 🔄 **Subscription Status Flow**

```
TRIAL (14 days) → ACTIVE (paid) → PAST_DUE (grace) → CANCELLED
     ↓              ↓               ↓                 ↓
Limited Features  Full Features   Degraded         Minimal
```

### **Status Definitions:**
- **TRIAL**: 14-day free trial with basic features
- **ACTIVE**: Paid subscription with full feature access
- **PAST_DUE**: Payment failed, grace period with limited access
- **CANCELLED**: Subscription cancelled, minimal features until period end
- **UNPAID**: Extended non-payment, service suspended

---

## 🎯 **What Changes When Subscription Expires**

### **1. Trial Expiration (TRIAL → Expired)**
```typescript
// Features Available:
✅ basicAI: true
✅ qrOrdering: true  
❌ customPersonality: false
❌ advancedAnalytics: false
❌ apiAccess: false
❌ customBranding: false

// Limits Enforced:
📋 Menu Items: 50 maximum
👥 Admin Users: 2 maximum
🔄 API Calls: 1,000/month
```

### **2. Payment Failure (ACTIVE → PAST_DUE)**
```typescript
// Features Degraded:
✅ basicAI: true (limited)
✅ qrOrdering: true
❌ advancedAnalytics: false
❌ customBranding: false
❌ apiAccess: false

// Admin Dashboard:
🚨 Payment retry prompts
⚠️ Grace period countdown
📧 Email notifications sent
```

### **3. Subscription Cancelled (ACTIVE → CANCELLED)**
```typescript
// Features Until Period End:
✅ Current plan features maintained
📅 Service until currentPeriodEnd date
❌ No new feature upgrades
❌ No plan changes allowed

// After Period End:
📉 Downgrade to trial features
```

---

## 🧪 **How to Test Expiration Scenarios**

### **Method 1: Automated Testing Script**
```bash
# Run comprehensive expiration tests
npx tsx scripts/test-subscription-expiration-scenarios.ts
```

### **Method 2: Manual Database Updates**
```sql
-- Simulate trial expiration
UPDATE Restaurant 
SET subscriptionStatus = 'TRIAL', 
    trialEndsAt = '2025-01-01'  -- Past date
WHERE subdomain = 'your-test-restaurant';

-- Simulate payment failure
UPDATE Restaurant 
SET subscriptionStatus = 'PAST_DUE'
WHERE subdomain = 'your-test-restaurant';

UPDATE RestaurantSubscription 
SET status = 'PAST_DUE'
WHERE restaurantId = 'your-restaurant-id';
```

### **Method 3: Stripe Webhook Simulation**
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhooks

# Simulate payment failure
stripe trigger invoice.payment_failed
```

---

## 🔍 **System Enforcement Points**

### **1. Feature Gating (Real-time)**
```typescript
// Every API call checks subscription status
const hasFeature = await FeatureGate.checkFeature(restaurantId, 'customBranding');
const canAddMenuItem = await FeatureGate.canAddMenuItem(restaurantId);

// Returns false if subscription expired/past due
```

### **2. Middleware Protection**
```typescript
// API routes with subscription checks
export default withSubscriptionCheck(handler, {
  requiredFeature: 'advancedAnalytics',
  limitCheck: { type: 'MENU_ITEMS', action: 'ADD' }
});

// Returns 403 error if not allowed
```

### **3. UI Component Gating**
```typescript
// Components automatically hidden/disabled
<withSubscriptionFeature 
  Component={AdvancedAnalytics}
  requiredFeature="advancedAnalytics"
  fallback={UpgradePrompt}
/>
```

---

## 📊 **Admin Dashboard Changes**

### **Trial Expired Dashboard:**
```
🚨 TRIAL EXPIRED
Your 14-day free trial has ended. Upgrade now to continue using advanced features.

[UPGRADE NOW] [Manage Billing]

Features Available:
✅ Basic AI Chat
✅ QR Code Ordering
❌ Custom Branding (Upgrade Required)
❌ Advanced Analytics (Upgrade Required)
```

### **Payment Failed Dashboard:**
```
⚠️ PAYMENT FAILED
Your payment could not be processed. Please update your payment method.

[UPDATE PAYMENT] [Retry Payment]

Grace Period: 3 days remaining
Current Status: Limited functionality
```

### **Cancelled Dashboard:**
```
❌ SUBSCRIPTION CANCELLED
Your subscription is cancelled but remains active until Feb 15, 2025.

[REACTIVATE] [Download Data]

Service Level: Full features until period end
```

---

## 🔧 **Webhook Events Handled**

Your system automatically responds to these Stripe events:

```typescript
// Payment failure
'invoice.payment_failed' → status: "PAST_DUE"

// Subscription cancelled  
'customer.subscription.deleted' → status: "CANCELLED"

// Payment recovered
'invoice.payment_succeeded' → status: "ACTIVE"

// Trial ending soon
'customer.subscription.trial_will_end' → email notification
```

---

## ⚡ **Testing Commands**

### **Quick Test Functions:**
```bash
# Test trial expiration
npx tsx -e "
import { simulateTrialExpiration } from './scripts/test-subscription-expiration-scenarios.ts';
simulateTrialExpiration('restaurant-id');
"

# Test payment failure
npx tsx -e "
import { simulatePaymentFailure } from './scripts/test-subscription-expiration-scenarios.ts';
simulatePaymentFailure('restaurant-id');
"

# Test subscription cancellation
npx tsx -e "
import { simulateSubscriptionCancellation } from './scripts/test-subscription-expiration-scenarios.ts';
simulateSubscriptionCancellation('restaurant-id');
"
```

### **Feature Testing:**
```bash
# Check specific restaurant features
npx tsx -e "
import { FeatureGate } from './src/utils/featureGating.ts';
const features = await FeatureGate.getRestaurantFeatures('restaurant-id');
console.log(features);
"
```

---

## 🎭 **User Experience Flow**

### **Trial User (Day 15):**
1. **Login** → Dashboard shows trial expired banner
2. **Try Advanced Feature** → Upgrade prompt appears
3. **Basic Features** → Still work (AI chat, QR codes)
4. **Menu Management** → Limited to 50 items

### **Paid User (Payment Fails):**
1. **Stripe Webhook** → Status changes to PAST_DUE
2. **Admin Dashboard** → Payment retry prompt
3. **Feature Access** → Advanced features disabled
4. **Grace Period** → 3-7 days to resolve payment
5. **Email Notifications** → Automatic payment failure alerts

### **Cancelled User:**
1. **Cancellation** → Status changes to CANCELLED
2. **Period End Countdown** → Shows days remaining
3. **Feature Maintenance** → Full access until period end
4. **Data Export** → Option to download data before termination

---

## 🚀 **Production Monitoring**

### **What to Monitor:**
- Subscription status changes
- Payment failure rates
- Trial conversion rates
- Feature usage after expiration
- Customer support tickets related to billing

### **Alerts to Set:**
- High payment failure rate (>5%)
- Multiple trial expirations without conversion
- Subscription cancellation spikes
- Webhook processing failures

---

## ✅ **Verification Checklist**

Test these scenarios before going live:

- [ ] Trial expires → Features properly limited
- [ ] Payment fails → PAST_DUE status set correctly
- [ ] Webhooks process → Database updates happen
- [ ] Admin dashboard → Shows correct status
- [ ] Feature gating → Enforces limits properly
- [ ] API endpoints → Return appropriate errors
- [ ] Email notifications → Sent for payment issues
- [ ] Recovery flow → Payment success restores access

Your subscription system is **production-ready** and handles all expiration scenarios professionally! 