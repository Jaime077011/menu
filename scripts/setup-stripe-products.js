#!/usr/bin/env node

/**
 * Stripe Products Setup Script
 * 
 * This script creates the required Stripe products and prices for the restaurant subscription system.
 * Run this script after setting up your Stripe account and adding your secret key to .env
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createStripeProducts() {
  console.log('🏪 Setting up Stripe products for Restaurant Subscription System...');
  console.log('=' .repeat(70));

  try {
    // Check if Stripe key is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
      console.log('❌ Please set your STRIPE_SECRET_KEY in .env file first');
      console.log('   Get your key from: https://dashboard.stripe.com/apikeys');
      process.exit(1);
    }

    const products = [];
    const prices = [];

    // Product 1: Starter Plan
    console.log('\n1️⃣ Creating Starter Plan...');
    const starterProduct = await stripe.products.create({
      name: 'Starter Plan',
      description: 'Perfect for small restaurants getting started with AI-powered ordering',
      metadata: {
        plan_type: 'starter',
        max_locations: '1',
        max_menu_items: '50',
        features: JSON.stringify({
          basicAI: true,
          qrOrdering: true,
          basicAnalytics: true,
          emailSupport: true,
          customPersonality: false,
          advancedAnalytics: false,
          phoneSupport: false,
          customBranding: false,
          multiLocation: false,
          staffManagement: false,
          advancedReporting: false,
          webhooks: false,
          apiAccess: false,
          integrations: false,
          whiteLabel: false,
          prioritySupport: false,
          dedicatedManager: false,
          customDevelopment: false,
          slaGuarantee: false,
          dataExport: false
        })
      }
    });

    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 2900, // $29.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_name: 'STARTER'
      }
    });

    products.push(starterProduct);
    prices.push(starterPrice);
    console.log(`   ✅ Created: ${starterProduct.name} - $29/month`);
    console.log(`   📋 Product ID: ${starterProduct.id}`);
    console.log(`   💰 Price ID: ${starterPrice.id}`);

    // Product 2: Professional Plan
    console.log('\n2️⃣ Creating Professional Plan...');
    const professionalProduct = await stripe.products.create({
      name: 'Professional Plan',
      description: 'Advanced features for growing restaurants with multiple needs',
      metadata: {
        plan_type: 'professional',
        max_locations: '3',
        max_menu_items: '200',
        features: JSON.stringify({
          basicAI: true,
          qrOrdering: true,
          basicAnalytics: true,
          emailSupport: true,
          customPersonality: true,
          advancedAnalytics: true,
          phoneSupport: true,
          customBranding: true,
          multiLocation: false,
          staffManagement: false,
          advancedReporting: false,
          webhooks: false,
          apiAccess: false,
          integrations: false,
          whiteLabel: false,
          prioritySupport: false,
          dedicatedManager: false,
          customDevelopment: false,
          slaGuarantee: false,
          dataExport: false
        })
      }
    });

    const professionalPrice = await stripe.prices.create({
      product: professionalProduct.id,
      unit_amount: 7900, // $79.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_name: 'PROFESSIONAL'
      }
    });

    products.push(professionalProduct);
    prices.push(professionalPrice);
    console.log(`   ✅ Created: ${professionalProduct.name} - $79/month`);
    console.log(`   📋 Product ID: ${professionalProduct.id}`);
    console.log(`   💰 Price ID: ${professionalPrice.id}`);

    // Product 3: Enterprise Plan
    console.log('\n3️⃣ Creating Enterprise Plan...');
    const enterpriseProduct = await stripe.products.create({
      name: 'Enterprise Plan',
      description: 'Complete solution for restaurant chains and large operations',
      metadata: {
        plan_type: 'enterprise',
        max_locations: '-1', // unlimited
        max_menu_items: '-1', // unlimited
        features: JSON.stringify({
          basicAI: true,
          qrOrdering: true,
          basicAnalytics: true,
          emailSupport: true,
          customPersonality: true,
          advancedAnalytics: true,
          phoneSupport: true,
          customBranding: true,
          multiLocation: true,
          staffManagement: true,
          advancedReporting: true,
          webhooks: true,
          apiAccess: true,
          integrations: true,
          whiteLabel: true,
          prioritySupport: true,
          dedicatedManager: true,
          customDevelopment: true,
          slaGuarantee: true,
          dataExport: true
        })
      }
    });

    const enterprisePrice = await stripe.prices.create({
      product: enterpriseProduct.id,
      unit_amount: 19900, // $199.00
      currency: 'usd',
      recurring: {
        interval: 'month'
      },
      metadata: {
        plan_name: 'ENTERPRISE'
      }
    });

    products.push(enterpriseProduct);
    prices.push(enterprisePrice);
    console.log(`   ✅ Created: ${enterpriseProduct.name} - $199/month`);
    console.log(`   📋 Product ID: ${enterpriseProduct.id}`);
    console.log(`   💰 Price ID: ${enterprisePrice.id}`);

    // Summary
    console.log('\n🎉 All products created successfully!');
    console.log('=' .repeat(70));

    console.log('\n📝 Add these to your .env file:');
    console.log('');
    console.log(`STRIPE_STARTER_PRICE_ID=${starterPrice.id}`);
    console.log(`STRIPE_PROFESSIONAL_PRICE_ID=${professionalPrice.id}`);
    console.log(`STRIPE_ENTERPRISE_PRICE_ID=${enterprisePrice.id}`);

    console.log('\n🔗 Next Steps:');
    console.log('1. Copy the price IDs above to your .env file');
    console.log('2. Set up webhooks in Stripe Dashboard');
    console.log('3. Add webhook secret to .env file');
    console.log('4. Test the subscription system');

    console.log('\n📊 Products Summary:');
    products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}: ${product.id}`);
    });

  } catch (error) {
    console.error('❌ Error creating Stripe products:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n💡 Make sure your STRIPE_SECRET_KEY is correct');
      console.log('   Get your key from: https://dashboard.stripe.com/apikeys');
    }
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createStripeProducts();
}

module.exports = { createStripeProducts }; 