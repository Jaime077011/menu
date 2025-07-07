# 🚀 Setup & Installation Guide

## 📋 Overview

This guide will help you set up the AI-Powered Restaurant Ordering System on your local development environment.

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v8 or higher) 
- **Git**
- **MySQL** (v8 or higher) or access to a MySQL database service
- **OpenAI API Key** (for AI functionality)
- **Stripe Account** (for payment processing)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd menus
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL="mysql://username:password@localhost:3306/menus"
   
   # OpenAI
   OPENAI_API_KEY="your-openai-api-key"
   
   # Stripe
   STRIPE_SECRET_KEY="your-stripe-secret-key"
   STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
   STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
   
   # Auth
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   
   # App Configuration
   APP_URL="http://localhost:3000"
   ```

### 4. Database Setup

1. Create the database:
   ```bash
   npm run db:push
   ```

2. Seed with sample data:
   ```bash
   npm run db:seed
   ```

### 5. Start Development Server

```bash
npm run dev
```

## 🌐 Access the Application

Once running, you can access:

- **Customer Interface**: `http://localhost:3000/pizza-palace`
- **Admin Panel**: `http://localhost:3000/admin`
- **Super Admin**: `http://localhost:3000/super-admin`

## 🔑 Default Credentials

### Admin User
- Email: `admin@pizzapalace.com`
- Password: `admin123`

### Super Admin
- Email: `super@example.com`
- Password: `super123`

## 📚 Next Steps

1. **Configuration**: Review [Configuration Guide](./CONFIGURATION.md)
2. **Development**: See [Development Setup](../development/SETUP.md)
3. **Deployment**: Check [Deployment Guide](../deployment/README.md)
4. **Troubleshooting**: Visit [Troubleshooting Guide](./TROUBLESHOOTING.md)

## 🔧 Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:push      # Push schema changes
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Generate Prisma client

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Linting & Formatting
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format:check # Check formatting
npm run format:write # Format code
```

## 📋 Verification Checklist

After setup, verify everything is working:

- [ ] Development server starts without errors
- [ ] Database connection established
- [ ] Customer chat interface loads
- [ ] Admin panel accessible
- [ ] Super admin panel accessible
- [ ] AI responses working (test with OpenAI key)
- [ ] Sample restaurants and menus visible

## 🆘 Need Help?

If you encounter issues:

1. Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Review [FAQ](../development/FAQ.md)
3. Contact the development team

---

**Last Updated**: January 2025 