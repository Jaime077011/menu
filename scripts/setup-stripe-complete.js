#!/usr/bin/env node

/**
 * Complete Stripe Setup Script
 * 
 * This script sets up everything needed for Stripe integration:
 * 1. Creates products and prices
 * 2. Sets up webhooks
 * 3. Generates .env configuration
 */

const fs = require('fs');
const path = require('path');

async function completeStripeSetup() {
  console.log('🚀 Complete Stripe Setup for Restaurant Subscription System');
  console.log('=' .repeat(70));

  // Check if .env exists
  const envPath = path.join(process.cwd(), '.env');
  const envExists = fs.existsSync(envPath);

  if (!envExists) {
    console.log('❌ .env file not found');
    console.log('   Create a .env file first with your Stripe secret key');
    process.exit(1);
  }

  // Load environment variables
  require('dotenv').config();

  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    console.log('❌ STRIPE_SECRET_KEY not found in .env file');
    console.log('');
    console.log('📝 Add this to your .env file:');
    console.log('STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here');
    console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here');
    console.log('');
    console.log('🔗 Get your keys from: https://dashboard.stripe.com/apikeys');
    process.exit(1);
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  try {
    console.log('\n1️⃣ Setting up Stripe products and prices...');
    console.log('-' .repeat(50));

    // Import and run product setup
    const { createStripeProducts } = require('./setup-stripe-products');
    await createStripeProducts();

    console.log('\n2️⃣ Setting up webhook endpoint...');
    console.log('-' .repeat(50));

    // Get webhook URL from command line or use default
    const webhookUrl = process.argv[2] || 'https://yourdomain.com/api/stripe/webhooks';
    
    if (webhookUrl === 'https://yourdomain.com/api/stripe/webhooks') {
      console.log('⚠️  Using placeholder webhook URL');
      console.log('   For production, run with your actual URL:');
      console.log('   node scripts/setup-stripe-complete.js https://your-domain.com/api/stripe/webhooks');
    }

    // Create webhook
    const events = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'customer.subscription.trial_will_end'
    ];

    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: events,
      description: 'Restaurant Subscription System Webhooks'
    });

    console.log(`✅ Webhook created: ${webhookEndpoint.id}`);

    console.log('\n3️⃣ Generating environment configuration...');
    console.log('-' .repeat(50));

    // Get the created prices
    const prices = await stripe.prices.list({ limit: 10 });
    const starterPrice = prices.data.find(p => p.metadata?.plan_name === 'STARTER');
    const professionalPrice = prices.data.find(p => p.metadata?.plan_name === 'PROFESSIONAL');
    const enterprisePrice = prices.data.find(p => p.metadata?.plan_name === 'ENTERPRISE');

    // Generate .env additions
    const envAdditions = `
# Stripe Configuration (Added by setup script)
STRIPE_WEBHOOK_SECRET=${webhookEndpoint.secret}
STRIPE_STARTER_PRICE_ID=${starterPrice?.id || 'PRICE_ID_NOT_FOUND'}
STRIPE_PROFESSIONAL_PRICE_ID=${professionalPrice?.id || 'PRICE_ID_NOT_FOUND'}
STRIPE_ENTERPRISE_PRICE_ID=${enterprisePrice?.id || 'PRICE_ID_NOT_FOUND'}
`;

    console.log('\n📝 Add these lines to your .env file:');
    console.log(envAdditions);

    // Optionally append to .env file
    const shouldAppend = process.argv.includes('--append-env');
    if (shouldAppend) {
      fs.appendFileSync(envPath, envAdditions);
      console.log('✅ Environment variables added to .env file');
    } else {
      console.log('💡 To automatically append to .env, run with --append-env flag');
    }

    console.log('\n🎉 Stripe setup complete!');
    console.log('=' .repeat(70));

    console.log('\n📊 Summary:');
    console.log(`✅ Products created: 3 (Starter, Professional, Enterprise)`);
    console.log(`✅ Prices created: 3 ($29, $79, $199)`);
    console.log(`✅ Webhook created: ${webhookEndpoint.id}`);
    console.log(`✅ Events configured: ${events.length}`);

    console.log('\n🔗 Next Steps:');
    console.log('1. Copy the environment variables to your .env file');
    console.log('2. Restart your development server');
    console.log('3. Test the subscription system at /admin/subscription');
    console.log('4. Use test card: 4242 4242 4242 4242');

    console.log('\n🧪 Testing Commands:');
    console.log('npm run dev                          # Start development server');
    console.log('npx tsx scripts/test-subscription-phase2-mock.ts  # Run tests');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n💡 Check your STRIPE_SECRET_KEY in .env file');
    }
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  completeStripeSetup();
}

module.exports = { completeStripeSetup }; 