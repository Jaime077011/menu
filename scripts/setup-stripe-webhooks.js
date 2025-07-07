#!/usr/bin/env node

/**
 * Stripe Webhooks Setup Script
 * 
 * This script creates the required webhook endpoint for the restaurant subscription system.
 * Run this script after setting up your Stripe account and products.
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createStripeWebhooks() {
  console.log('🔗 Setting up Stripe webhooks for Restaurant Subscription System...');
  console.log('=' .repeat(70));

  try {
    // Check if Stripe key is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
      console.log('❌ Please set your STRIPE_SECRET_KEY in .env file first');
      console.log('   Get your key from: https://dashboard.stripe.com/apikeys');
      process.exit(1);
    }

    // Get the webhook URL
    const webhookUrl = process.argv[2] || 'https://yourdomain.com/api/stripe/webhooks';
    
    if (webhookUrl === 'https://yourdomain.com/api/stripe/webhooks') {
      console.log('⚠️  Using default webhook URL. You should provide your actual URL:');
      console.log('   node scripts/setup-stripe-webhooks.js https://your-domain.com/api/stripe/webhooks');
      console.log('   or for development:');
      console.log('   node scripts/setup-stripe-webhooks.js https://your-ngrok-url.ngrok.io/api/stripe/webhooks');
      console.log('');
    }

    console.log(`🎯 Creating webhook endpoint: ${webhookUrl}`);

    // Define the events we want to listen for
    const events = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'customer.subscription.trial_will_end'
    ];

    // Create the webhook endpoint
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: events,
      description: 'Restaurant Subscription System Webhooks',
      metadata: {
        system: 'restaurant-subscription',
        version: '1.0',
        created_by: 'setup-script'
      }
    });

    console.log('\n✅ Webhook endpoint created successfully!');
    console.log('=' .repeat(70));

    console.log('\n📋 Webhook Details:');
    console.log(`   ID: ${webhookEndpoint.id}`);
    console.log(`   URL: ${webhookEndpoint.url}`);
    console.log(`   Status: ${webhookEndpoint.status}`);
    console.log(`   Secret: ${webhookEndpoint.secret}`);

    console.log('\n📡 Enabled Events:');
    events.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event}`);
    });

    console.log('\n📝 Add this to your .env file:');
    console.log('');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhookEndpoint.secret}`);

    console.log('\n🧪 Testing Your Webhook:');
    console.log('1. Install Stripe CLI: https://stripe.com/docs/stripe-cli');
    console.log('2. Login: stripe login');
    console.log('3. Forward events to local server:');
    console.log('   stripe listen --forward-to localhost:3000/api/stripe/webhooks');
    console.log('4. Trigger test events:');
    console.log('   stripe trigger checkout.session.completed');

    console.log('\n🔧 Webhook Configuration Complete!');
    console.log('Next: Copy the webhook secret to your .env file');

  } catch (error) {
    console.error('❌ Error creating webhook:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n💡 Make sure your STRIPE_SECRET_KEY is correct');
      console.log('   Get your key from: https://dashboard.stripe.com/apikeys');
    }
    
    if (error.code === 'url_invalid') {
      console.log('\n💡 Make sure your webhook URL is valid and accessible');
      console.log('   For development, use ngrok: https://ngrok.com/');
    }
    
    process.exit(1);
  }
}

// List existing webhooks
async function listWebhooks() {
  console.log('📋 Listing existing webhooks...');
  
  try {
    const webhooks = await stripe.webhookEndpoints.list();
    
    if (webhooks.data.length === 0) {
      console.log('   No webhooks found');
      return;
    }

    console.log(`   Found ${webhooks.data.length} webhook(s):`);
    webhooks.data.forEach((webhook, index) => {
      console.log(`   ${index + 1}. ${webhook.url} (${webhook.status})`);
      console.log(`      ID: ${webhook.id}`);
      console.log(`      Events: ${webhook.enabled_events.length}`);
    });

  } catch (error) {
    console.error('❌ Error listing webhooks:', error.message);
  }
}

// Run the script
const command = process.argv[2];

if (command === 'list') {
  listWebhooks()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
} else {
  createStripeWebhooks()
    .then(() => {
      console.log('\n✅ Stripe webhooks setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Error setting up webhooks:', error.message);
      process.exit(1);
    });
}

export { createStripeWebhooks, listWebhooks }; 