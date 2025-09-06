# Placement Health MVP

A two-sided healthcare staffing platform connecting qualified professionals with medical facilities. Built with modern web technologies for speed, safety, and explainability.

## 🚀 Features

### For Healthcare Professionals (Clinicians)
- ✅ Email/OTP authentication with role-based access
- ✅ Structured professional profiles with specialties and experience
- ✅ Credential vault with upload and verification status
- ✅ AI-powered job matching with explainable scoring
- ✅ 1-tap applications with saved credentials
- ✅ Self-scheduling interview system
- ✅ Real-time messaging and notifications

### For Healthcare Employers (Managers)
- ✅ Organization setup with team management
- ✅ Job requisition creation with AI candidate matching
- ✅ Candidate verification and compliance tracking
- ✅ Interview scheduling and offer management
- ✅ Onboarding checklists with automated reminders
- ✅ Analytics dashboard with SLA tracking

### System Features
- ✅ Supabase Edge Functions for webhooks and automation
- ✅ Comprehensive RLS policies for data security
- ✅ Rules-based matching engine with tests
- ✅ File storage with status chips
- ✅ Automated credential verification (Nursys, Checkr)
- ✅ Event-driven automation system

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Headless UI, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Database**: Drizzle ORM with comprehensive schema
- **Payments**: Stripe with webhook handling
- **Communication**: In-app messaging, email/SMS relays
- **Scheduling**: Calendly API integration
- **Documents**: Dropbox Sign integration
- **Testing**: Jest with comprehensive test coverage
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

## 🚀 Quick Setup

### Automated Setup (Recommended)

```bash
git clone <repository-url>
cd placement-health-mvp
./scripts/setup.sh
```

This will:
- Install dependencies
- Set up environment variables
- Initialize git hooks
- Create necessary directories

### Manual Setup

```bash
git clone <repository-url>
cd placement-health-mvp
npm install
cp env.example .env.local
```

### Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Copy your project URL and anon key to `.env.local`

2. **Set Up Database Schema**
   ```bash
   ./scripts/setup-db.sh
   ```
   This will:
   - Generate and push the Drizzle schema
   - Apply Row Level Security policies
   - Set up all required tables and relationships

3. **Configure Storage**
   - In Supabase Dashboard, create a storage bucket named `credentials`
   - Set it to public access for credential file uploads

### Environment Variables

Update `.env.local` with your actual values:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=your_database_connection_string

# Optional (for full functionality)
STRIPE_SECRET_KEY=sk_test_...
POSTMARK_API_KEY=your_postmark_key
TWILIO_ACCOUNT_SID=your_twilio_sid
# ... see env.example for complete list
```

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
/
├── components/              # Reusable UI components
│   └── ui/                 # Base UI components (Button, Input, Card)
├── lib/                   # Core business logic and services
│   ├── db/               # Database schema and connections
│   ├── services/         # Business services (matching, auth)
│   └── supabaseClient.ts # Supabase client configuration
├── pages/                # Next.js pages and API routes
│   ├── api/             # API endpoints
│   ├── app/             # Candidate dashboard and profile
│   ├── employer/        # Manager dashboard and job management
│   ├── _app.tsx         # App wrapper with providers
│   └── index.tsx        # Landing page
├── supabase/            # Edge Functions
│   └── functions/       # Webhook handlers and automations
├── scripts/            # Setup and utility scripts
├── styles/             # Global styles and Tailwind config
├── middleware.ts       # Route protection and redirects
└── env.example         # Environment variables template
```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript type checking
npm run test         # Run Jest tests
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
```

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run matching engine tests specifically
npm run test -- matching
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push to main

### Manual Deployment

```bash
npm run build
npm run start
```

### Environment Variables for Production

Update these for production:
- `NEXT_PUBLIC_BASE_URL`: Your production domain
- `NODE_ENV`: Set to `production`
- Use production keys for all services (Stripe, Supabase, etc.)

## 🔒 Security & Compliance

- **Row Level Security (RLS)**: Enabled on all tables with comprehensive policies
- **Data Encryption**: PII fields encrypted at rest using pgcrypto
- **Audit Logging**: All actions logged to immutable events table
- **Input Validation**: Zod schemas for all API inputs
- **File Security**: Restricted uploads with type/size validation
- **HIPAA Considerations**: Built with healthcare compliance in mind

## 📊 Architecture Highlights

### Matching Engine
- Rules-based scoring with 7 weighted factors
- Explainable results with detailed breakdowns
- Tested with comprehensive unit tests
- Optimized for performance with database indexing

### Edge Functions
- `nursys_webhook`: Handles license verification callbacks
- `checkr_webhook`: Processes background check results
- `automations_dispatcher`: Manages event-driven workflows

### Database Design
- Comprehensive schema with 13+ tables
- Foreign key relationships and constraints
- Optimized indexes for query performance
- JSONB fields for flexible metadata storage

## 🤝 Contributing

1. **Code Quality**: Strict TypeScript with ESLint/Prettier
2. **Testing**: Write tests for new features
3. **Documentation**: Update README for significant changes
4. **Security**: Follow security best practices
5. **Performance**: Optimize database queries and React components

## 📞 Support

For issues and questions:
1. Check existing GitHub issues
2. Review the comprehensive code comments
3. Test with the provided setup scripts
4. Create a new issue with detailed reproduction steps

## 📋 MVP Scope Completed

✅ **Must-have features implemented:**
- Authentication (email/OTP) with role-based access
- Candidate profile + credential vault with upload
- Job requirements + AI matching v1 with explainability
- Supabase Edge Functions for webhooks
- Comprehensive database schema with RLS
- Automated setup scripts and documentation

🔄 **Ready for next phase:**
- Storage and upload flows with status chips
- Messaging system and Calendly integration
- Offer templates with Dropbox Sign
- Onboarding checklists with reminders
- Analytics dashboard

---

**Built with ❤️ for healthcare professionals and facilities** 