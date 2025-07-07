# 🚀 Deployment Guide

This guide will help you deploy your AI-Powered Restaurant Menu Assistant to production using Vercel and a cloud database.

## 📋 Prerequisites

- [Vercel Account](https://vercel.com) (free tier available)
- [PlanetScale Account](https://planetscale.com) or [Railway Account](https://railway.app) for MySQL database
- [OpenAI API Key](https://platform.openai.com/api-keys)
- Git repository (GitHub, GitLab, or Bitbucket)

## 🗄️ Database Setup

### Option 1: PlanetScale (Recommended)

1. **Create PlanetScale Account**
   - Go to [planetscale.com](https://planetscale.com)
   - Sign up for a free account

2. **Create Database**
   ```bash
   # Install PlanetScale CLI
   npm install -g @planetscale/cli
   
   # Login to PlanetScale
   pscale auth login
   
   # Create database
   pscale database create restaurant-menu-app
   
   # Create development branch
   pscale branch create restaurant-menu-app dev
   
   # Get connection string
   pscale connect restaurant-menu-app dev --port 3309
   ```

3. **Get Connection String**
   - Go to your database dashboard
   - Click "Connect" → "Prisma"
   - Copy the connection string

### Option 2: Railway

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy MySQL**
   - Create new project
   - Add MySQL service
   - Copy the connection string from variables

## 🔧 Environment Variables Setup

Create these environment variables in Vercel:

### Required Variables

```bash
# Database
DATABASE_URL="mysql://username:password@host:port/database"

# NextAuth.js - Generate a secure secret
NEXTAUTH_SECRET="your-32-character-secret-key-here"
NEXTAUTH_URL="https://your-app-name.vercel.app"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key-here"
```

### Optional Variables

```bash
# Error Tracking (Recommended for production)
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"

# Analytics
ANALYTICS_ID="your-analytics-id"

# Discord OAuth (if using Discord login)
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"
```

## 🚀 Vercel Deployment

### Step 1: Prepare Repository

1. **Push to Git**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

### Step 2: Deploy to Vercel

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository

2. **Configure Build Settings**
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables from above
   - Make sure to set them for **Production**, **Preview**, and **Development**

### Step 3: Database Migration

1. **Run Prisma Migration**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Push schema to database
   npx prisma db push
   
   # Seed database (optional)
   npx prisma db seed
   ```

2. **Or use Vercel CLI**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel --prod
   
   # Run migration on Vercel
   vercel env pull .env.local
   npx prisma db push
   ```

## 🔒 Security Configuration

### 1. Generate Secure Secrets

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. Configure CORS (if needed)

The `vercel.json` file already includes security headers. Update domains as needed:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://your-domain.com"
        }
      ]
    }
  ]
}
```

## 🌐 Custom Domain Setup

### 1. Add Domain to Vercel

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### 2. Update Environment Variables

```bash
NEXTAUTH_URL="https://your-custom-domain.com"
```

## 📊 Monitoring Setup

### 1. Health Check

Your app includes a health check endpoint:
- **URL**: `https://your-app.vercel.app/api/health`
- **Purpose**: Monitor database, environment, and memory

### 2. Error Tracking (Optional)

1. **Setup Sentry**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Add Sentry DSN**
   ```bash
   SENTRY_DSN="https://your-dsn@sentry.io/project-id"
   ```

## 🧪 Testing Deployment

### 1. Verify Health Check

```bash
curl https://your-app.vercel.app/api/health
```

### 2. Test Core Features

1. **Admin Login**: `/admin/login`
2. **Restaurant Chat**: `https://pizza-palace.your-app.vercel.app`
3. **Kitchen Dashboard**: `/admin/kitchen`
4. **Menu Management**: `/admin/menu`

### 3. Performance Testing

Visit `/test-phase7` to run comprehensive tests:
- Error handling
- Loading states
- Performance metrics
- Character functionality

## 🔄 Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

### Preview Deployments

Every pull request gets a preview deployment:
- Test changes before merging
- Share with team for review
- Automatic cleanup after merge

## 📈 Scaling Considerations

### Database Scaling

- **PlanetScale**: Automatic scaling with branching
- **Railway**: Upgrade plan for more resources

### Vercel Scaling

- **Pro Plan**: For production apps with custom domains
- **Team Plan**: For collaborative development

### Performance Optimization

1. **Image Optimization**: Already configured with Next.js
2. **Caching**: Vercel Edge Network handles this
3. **Bundle Analysis**: Run `npm run build` to see bundle size

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` is correct
   - Check database is accessible from Vercel
   - Run `npx prisma db push` to sync schema

2. **Environment Variable Issues**
   - Ensure all required variables are set
   - Check variable names match exactly
   - Redeploy after adding variables

3. **Build Failures**
   - Check build logs in Vercel dashboard
   - Verify all dependencies are in `package.json`
   - Test build locally: `npm run build`

### Debug Commands

```bash
# Check environment variables
vercel env ls

# View deployment logs
vercel logs

# Test locally with production build
npm run build && npm start
```

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs
2. Test health endpoint: `/api/health`
3. Verify environment variables
4. Check database connectivity

## 🎉 Success!

Once deployed, your AI-Powered Restaurant Menu Assistant will be live with:

- ✅ Multi-tenant restaurant support
- ✅ AI-powered virtual waiter
- ✅ Real-time order management
- ✅ Kitchen dashboard
- ✅ Admin management interface
- ✅ QR code table system
- ✅ Character personality system
- ✅ Comprehensive error handling
- ✅ Performance monitoring

**Your production URL**: `https://your-app-name.vercel.app`

---

*Need help? Check the troubleshooting section or contact support.* 