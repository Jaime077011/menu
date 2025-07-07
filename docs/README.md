# 🍽️ AI-Powered Restaurant Ordering System

## 📋 Overview

This is a **multi-tenant AI-powered restaurant ordering system** built with the T3 Stack (Next.js, tRPC, Prisma, TypeScript). The system enables restaurants to provide customers with an intelligent chat-based ordering experience through QR codes, complete with subscription management, super admin oversight, and advanced AI capabilities.

## 🚀 Key Features

- **🤖 AI-Powered Chat Ordering**: Customers interact with an AI waiter through natural conversation
- **🏪 Multi-Tenant Architecture**: Each restaurant has its own subdomain and isolated data
- **💳 Subscription Management**: Stripe-powered billing with multiple tiers and feature gating
- **👑 Super Admin Panel**: Centralized management for all restaurants and subscriptions
- **🎭 Customizable AI Personalities**: Restaurants can customize their AI waiter's personality
- **📊 Advanced Analytics**: Real-time performance monitoring and business insights
- **🎨 Interactive UI**: Rive animations and modern responsive design
- **🔐 Secure Authentication**: Multi-layered auth for customers, admins, and super admins

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Customer UI   │    │   Admin Panel   │    │ Super Admin     │
│  (Chat Interface)│    │  (Restaurant)   │    │  (Platform)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   tRPC API      │
                    │  (Next.js/T3)   │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Database      │
                    │  (MySQL/Prisma) │
                    └─────────────────┘
```

## 📚 Documentation Structure

### 🎯 Getting Started
- [`/setup/`](./setup/) - Installation and setup guides
- [`/deployment/`](./deployment/) - Production deployment guides
- [`/architecture/`](./architecture/) - System architecture documentation

### 🔧 Development
- [`/development/`](./development/) - Development guides and workflows
- [`/api/`](./api/) - API documentation and endpoints
- [`/testing/`](./testing/) - Testing strategies and guides

### 🚀 Features
- [`/features/`](./features/) - Feature documentation and implementation guides
- [`/phases/`](./phases/) - Development phase documentation
- [`/ai/`](./ai/) - AI system documentation and configuration

### 🎛️ Administration
- [`/admin/`](./admin/) - Restaurant admin documentation
- [`/super-admin/`](./super-admin/) - Super admin documentation
- [`/subscriptions/`](./subscriptions/) - Subscription and billing documentation

### 📊 Analytics & Monitoring
- [`/analytics/`](./analytics/) - Performance monitoring and analytics
- [`/reports/`](./reports/) - Testing reports and system status

## 🛠️ Tech Stack

```
Frontend:     Next.js 15 + React 19 + TypeScript + Tailwind CSS
Backend:      tRPC + Prisma + MySQL
AI:           OpenAI GPT-4 + Custom action detection
Payments:     Stripe (subscriptions + billing)
Animations:   Rive + Framer Motion
State:        Zustand + React Query
Testing:      Jest + Testing Library
Deployment:   Vercel + PlanetScale
```

## 🚀 Quick Start

1. **Clone and Setup**:
   ```bash
   git clone <repository-url>
   cd menus
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start Development**:
   ```bash
   npm run dev
   ```

5. **Visit the App**:
   - Customer Interface: `http://localhost:3000/pizza-palace`
   - Admin Panel: `http://localhost:3000/admin`
   - Super Admin: `http://localhost:3000/super-admin`

## 📋 Project Status

### ✅ Completed Features
- Multi-tenant architecture with subdomain routing
- AI-powered chat ordering system
- Subscription management with Stripe integration
- Super admin dashboard and management
- Advanced AI personality customization
- Order processing and kitchen management
- Analytics and performance monitoring

### 🔄 In Progress
- Advanced AI optimization and monitoring
- Enhanced analytics dashboard
- Mobile app development
- API documentation completion

### 📋 Planned Features
- Multi-language support
- Voice ordering capabilities
- Integration with POS systems
- Advanced reporting and insights

## 🤝 Contributing

See [`/development/CONTRIBUTING.md`](./development/CONTRIBUTING.md) for contribution guidelines.

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For technical support and questions:
- Check the [`/setup/TROUBLESHOOTING.md`](./setup/TROUBLESHOOTING.md) guide
- Review the [`/development/FAQ.md`](./development/FAQ.md)
- Contact the development team

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: Production Ready
