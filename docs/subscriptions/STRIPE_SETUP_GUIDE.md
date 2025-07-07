# Stripe Setup Guide for Restaurant Subscription System

## 🎯 **Overview**
This guide will help you set up Stripe products, prices, and webhooks for the restaurant subscription system.

---

## 🏪 **Step 1: Create Stripe Products**

### **Product 1: Starter Plan**
```
Product Name: Starter Plan
Description: Perfect for small restaurants getting started with AI-powered ordering
Statement Descriptor: STARTER PLAN
```

**Features to highlight:**
- 1 Restaurant Location
- 50 Menu Items
- Basic AI Waiter
- QR Code Ordering
- Basic Analytics
- Email Support

### **Product 2: Professional Plan**
```
Product Name: Professional Plan
Description: Advanced features for growing restaurants with multiple needs
Statement Descriptor: PROFESSIONAL PLAN
```

**Features to highlight:**
- 3 Restaurant Locations
- 200 Menu Items
- Custom AI Personality
- Advanced Analytics
- Phone Support
- Custom Branding

### **Product 3: Enterprise Plan**
```
Product Name: Enterprise Plan
Description: Complete solution for restaurant chains and large operations
Statement Descriptor: ENTERPRISE PLAN
```

**Features to highlight:**
- Unlimited Locations
- Unlimited Menu Items
- Multi-Location Management
- Staff Management
- Advanced Reporting
- Webhooks & API Access
- Integrations
- White Label Solution
- Priority Support
- Dedicated Account Manager
- Custom Development
- SLA Guarantee
- Data Export

---

## 💰 **Step 2: Create Stripe Prices**

### **Starter Plan Price**
```
Product: Starter Plan
Price: $29.00 USD
Billing: Monthly recurring
Usage Type: Licensed
```

### **Professional Plan Price**
```
Product: Professional Plan
Price: $79.00 USD
Billing: Monthly recurring
Usage Type: Licensed
```

### **Enterprise Plan Price**
```
Product: Enterprise Plan
Price: $199.00 USD
Billing: Monthly recurring
Usage Type: Licensed
```

---

## 🔗 **Step 3: Webhook Configuration**

### **Webhook Endpoint URL**
```
Production: https://yourdomain.com/api/stripe/webhooks
Development: https://your-ngrok-url.ngrok.io/api/stripe/webhooks
```

### **Events to Listen For**
Select these events in your Stripe webhook configuration:

```
✅ checkout.session.completed
✅ customer.subscription.created
✅ customer.subscription.updated
✅ customer.subscription.deleted
✅ invoice.payment_succeeded
✅ invoice.payment_failed
✅ customer.subscription.trial_will_end
```

### **Webhook Description**
```
Description: Restaurant Subscription System Webhooks
```

---

## 🔧 **Step 4: Get Your API Keys**

After creating products and webhooks, collect these values:

### **API Keys (Dashboard → Developers → API keys)**
```
Publishable Key: pk_test_... (for frontend)
Secret Key: sk_test_... (for backend)
```

### **Price IDs (From your created products)**
```
Starter Price ID: price_...
Professional Price ID: price_...
Enterprise Price ID: price_...
```

### **Webhook Secret (From your webhook endpoint)**
```
Webhook Secret: whsec_...
```

---

## 📝 **Step 5: Environment Variables**

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
STRIPE_STARTER_PRICE_ID=price_your_actual_starter_price_id_here
STRIPE_PROFESSIONAL_PRICE_ID=price_your_actual_professional_price_id_here
STRIPE_ENTERPRISE_PRICE_ID=price_your_actual_enterprise_price_id_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
```

---

## 🧪 **Step 6: Testing Setup**

### **Test Cards for Development**
```
Successful Payment: 4242 4242 4242 4242
Declined Payment: 4000 0000 0000 0002
Requires Authentication: 4000 0000 0000 3220
```

### **Test Webhook Events**
Use Stripe CLI to test webhooks locally:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

---

## 🚀 **Step 7: Production Checklist**

Before going live:

- [ ] Switch to live API keys (remove `_test_` from keys)
- [ ] Update webhook endpoint to production URL
- [ ] Test all payment flows
- [ ] Verify webhook delivery
- [ ] Set up monitoring and alerts
- [ ] Configure tax settings if needed
- [ ] Set up billing portal customization

---

## 📞 **Support**

If you need help with Stripe setup:
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Stripe Community: https://github.com/stripe

---

**Next: Copy the price IDs from Stripe and update your .env file!** 