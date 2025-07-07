# Vercel Deployment Guide

## Required Environment Variables

Add these environment variables in your Vercel dashboard (Settings > Environment Variables):

### Database Configuration
```
DATABASE_URL=mysql://username:password@host:port/database_name
```
**Note**: Use PlanetScale, Neon, or another MySQL-compatible database service.

### Authentication
```
AUTH_SECRET=your_secret_key_here
AUTH_DISCORD_ID=your_discord_id (optional)
AUTH_DISCORD_SECRET=your_discord_secret (optional)
```

### OpenAI Configuration
```
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
```

### Stripe Configuration
```
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_STARTER_PRICE_ID=price_your_starter_price_id
STRIPE_PROFESSIONAL_PRICE_ID=price_your_professional_price_id
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
```

### Build Settings
```
NODE_ENV=production
SKIP_ENV_VALIDATION=false
```

## Database Setup

1. **PlanetScale (Recommended)**:
   - Create a free PlanetScale account
   - Create a new database
   - Get the connection string
   - Add to `DATABASE_URL` in Vercel

2. **Neon PostgreSQL Alternative**:
   - If you prefer PostgreSQL, update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

## Vercel Deployment Steps

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Fix deployment configuration"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

3. **Post-Deployment**:
   - Run database migrations in Vercel dashboard
   - Set up Stripe webhooks pointing to your Vercel domain
   - Test all functionality

## Common Issues and Solutions

### Build Errors
- TypeScript errors: Now ignored in production builds
- ESLint errors: Now ignored in production builds
- Missing environment variables: Check all required vars are set

### Database Connection
- Ensure `DATABASE_URL` is properly formatted
- Check database service is accessible from Vercel
- Verify connection pooling is configured

### Stripe Integration
- Update webhook endpoints in Stripe dashboard
- Test payment flows in Stripe test mode first
- Verify all price IDs are correct

## Build Commands

Vercel will automatically use these commands:
- Install: `npm install`
- Build: `npm run build`
- Start: `npm start`

## Function Configuration

The project includes optimized function timeouts:
- Standard API routes: 30 seconds
- Chat API routes: 60 seconds (for OpenAI processing)
- Stripe webhooks: 30 seconds

## Security Headers

All security headers are configured in `vercel.json`:
- Content Security Policy
- XSS Protection
- Frame Options
- Referrer Policy

## Next Steps After Deployment

1. Test all major features
2. Set up monitoring and analytics
3. Configure custom domain if needed
4. Set up SSL certificate (automatic with Vercel)
5. Configure CDN settings for static assets 