# Motif

A production-ready platform that helps founders turn startup ideas into fundable ventures, connecting them with VCs through an admin-curated pipeline.

---

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Folder Structure](#folder-structure)
- [Role-Based Flow Explanation](#role-based-flow-explanation)
- [Environment Setup](#environment-setup)
- [Local Development Setup](#local-development-setup)
- [Deployment](#deployment)
- [Debugging & Lessons Learned](#debugging--lessons-learned)
- [Current Status](#current-status)
- [Future Improvements](#future-improvements)
- [Author](#author)

---

## Project Overview

**Motif** is a web platform designed to bridge the gap between early-stage founders and venture capitalists.

### The Problem

Founders struggle to get their startup ideas in front of the right investors. VCs are overwhelmed with unvetted pitches. There's no quality filter in between.

### The Solution

Motif provides:
- **AI-powered idea analysis** to help founders refine their concepts
- **Admin-curated approval pipeline** to ensure quality control
- **Direct VC access** to vetted, investment-ready startups

### Who It's For

| Role | Description |
|------|-------------|
| **Founders** | Submit startup ideas, get AI feedback, and request VC introductions |
| **VCs** | Browse pre-vetted startups and manage intro requests |
| **Admins/Super Admins** | Review submissions, approve/reject startups, manage case studies |

---

## Features

### Authentication System
- Supabase Auth with Google OAuth integration
- Session persistence via localStorage
- Auto-redirect based on user role after login
- Profile auto-creation for new users with default `founder` role

### Role-Based Access & Routing
- Five distinct roles: `super_admin`, `admin`, `founder`, `vc`, `vc_pending`
- Route protection via `ProtectedRoute` component
- Automatic role-based redirects via `RoleRedirect` component
- Super Admin inherits access to all Admin routes

### Founder Dashboard
- Submit new startup ideas with pitch details
- View all submitted ideas and their approval status
- AI-powered idea analysis using Groq LLM
- Pitch creator tool for refining presentations
- Request VC introductions for approved startups
- Saved ideas management
- Notifications center

### VC Dashboard
- Browse approved startups
- View detailed startup information
- Manage incoming intro requests
- Pending approval state (`vc_pending`) for new VC signups

### Admin / Super Admin Panel
- Review all submitted startups
- Approve or reject startups for VC visibility
- Manage intro requests between founders and VCs
- Case studies CRUD (Create, Read, Update, Delete)
- Dashboard metrics overview

### Idea Analysis & Startup Tools
- AI-powered idea scoring (strengths, weaknesses, recommendations)
- Market size and competition analysis
- AI idea generator for inspiration
- Pitch deck creator

### Notifications & Approvals Flow
- Real-time notification system
- Status transitions: `draft` → `pending_review` → `approved_for_vc` / `rejected`
- Status validation guards to prevent invalid transitions

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool & dev server |
| React Router v7 | Client-side routing |
| Tailwind CSS | Utility-first styling |
| Radix UI | Accessible UI primitives |
| Lucide React | Icon library |
| Motion (Framer) | Animations |
| Recharts | Dashboard charts |
| Sonner | Toast notifications |

### Backend / Services
| Technology | Purpose |
|------------|---------|
| Supabase | Database, Auth, Real-time |
| Groq API | LLM-powered idea analysis (Llama 3.3 70B) |

### Authentication
| Technology | Purpose |
|------------|---------|
| Supabase Auth | Session management |
| Google OAuth | Social login via `@react-oauth/google` |

### Deployment
| Technology | Purpose |
|------------|---------|
| Vercel | Hosting & CI/CD |
| GitHub | Version control |

### Tooling
| Tool | Purpose |
|------|---------|
| ESLint | Linting |
| Prettier | Code formatting |
| TypeScript Compiler | Type checking |

---

## System Architecture

### High-Level Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Founder   │────▶│    Motif     │◀────│     VC      │
│  (React UI) │     │   (Vite +    │     │  (React UI) │
└─────────────┘     │   Supabase)  │     └─────────────┘
                    └──────────────┘
                           │
                    ┌──────▼──────┐
                    │    Admin    │
                    │   (Review)  │
                    └─────────────┘
```

### Auth Flow

1. User clicks "Sign in with Google"
2. Supabase Auth handles OAuth redirect
3. On success, `UserContext` loads session and profile
4. If no profile exists, auto-create with `role: 'founder'`
5. `RoleRedirect` sends user to role-appropriate dashboard

### Role Resolution Logic

```typescript
// src/types/roles.ts
switch (normalizedRole) {
  case UserRole.SUPER_ADMIN:
  case UserRole.ADMIN:
    return '/admin/dashboard';
  case UserRole.FOUNDER:
    return '/dashboard/home';
  case UserRole.VC:
    return '/vc/dashboard';
  case UserRole.VC_PENDING:
    return '/vc/pending';
  default:
    return '/dashboard/home';
}
```

### Route Protection Logic

```tsx
// ProtectedRoute checks:
1. Is user authenticated? → No → Redirect to /auth
2. Is profile loaded? → No → Redirect to /auth
3. Does user role match allowedRoles? → No → Redirect to role-default route
4. Authorized → Render children
```

---

## Folder Structure

```
idea-forge-website/
├── public/                    # Static assets
├── src/
│   ├── App.tsx                # Main router & layout controller
│   ├── main.tsx               # React entry point
│   ├── index.css              # Global styles
│   │
│   ├── components/
│   │   ├── ui/                # Reusable UI primitives (Button, Card, Dialog, etc.)
│   │   ├── pages/             # Page-level components
│   │   │   ├── admin/         # Admin dashboard pages
│   │   │   ├── vc/            # VC portal pages
│   │   │   ├── founder/       # Founder-specific pages
│   │   │   ├── HomePage.tsx   # Public landing page
│   │   │   ├── AuthPage.tsx   # Login/signup
│   │   │   └── ...            # Other pages
│   │   ├── ProtectedRoute.tsx # Route guard component
│   │   ├── RoleRedirect.tsx   # Role-based redirect handler
│   │   ├── Navbar.tsx         # Main navigation
│   │   ├── Footer.tsx         # Site footer
│   │   ├── Chatbot.tsx        # AI assistant widget
│   │   └── ...                # Other shared components
│   │
│   ├── contexts/
│   │   └── UserContext.tsx    # Global auth & user state
│   │
│   ├── hooks/
│   │   ├── useAsyncAction.ts  # Async operation helper
│   │   └── useDemoMode.ts     # Demo mode detection
│   │
│   ├── layouts/
│   │   ├── AdminLayout.tsx    # Admin panel layout wrapper
│   │   └── VCLayout.tsx       # VC portal layout wrapper
│   │
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client initialization
│   │   ├── groq.ts            # Groq API client
│   │   ├── groqAnalysis.ts    # AI idea analysis logic
│   │   ├── ideasService.ts    # Ideas CRUD operations
│   │   ├── startupService.ts  # Startup management
│   │   ├── introRequestService.ts # VC intro requests
│   │   ├── notificationService.ts # Notifications CRUD
│   │   ├── roleVerification.ts    # Role validation helpers
│   │   ├── statusValidation.ts    # Status transition guards
│   │   └── safeFetch.ts           # Error-handled fetch wrapper
│   │
│   ├── types/
│   │   └── roles.ts           # UserRole enum & helpers
│   │
│   └── styles/
│       └── globals.css        # Tailwind imports
│
├── vercel.json                # Vercel deployment config
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript config
├── eslint.config.js           # ESLint rules
└── package.json               # Dependencies & scripts
```

---

## Role-Based Flow Explanation

### Founder Flow

1. Sign up / Log in → Auto-assigned `founder` role
2. Land on `/dashboard/home`
3. Submit startup idea → Status: `draft`
4. Submit for review → Status: `pending_review`
5. Admin reviews → Status: `approved_for_vc` or `rejected`
6. If approved, request VC intro
7. Track notifications for updates

### VC Flow

1. Sign up as VC → Role: `vc_pending`
2. Land on `/vc/pending` (waiting approval page)
3. Admin approves → Role: `vc`
4. Access `/vc/dashboard`
5. Browse approved startups
6. View detailed startup info
7. Manage intro requests

### Admin Flow

1. Manually assigned `admin` or `super_admin` role in Supabase
2. Land on `/admin/dashboard`
3. Review `pending_review` startups
4. Approve → `approved_for_vc` (visible to VCs)
5. Reject → `rejected` (hidden from VCs)
6. Manage VC intro requests
7. CRUD case studies

### Pending / Restricted States

| State | Behavior |
|-------|----------|
| `vc_pending` | Can access `/vc/pending` only |
| No role / invalid | Defaults to `founder`, redirects to `/dashboard/home` |
| Unauthenticated | Redirects to `/auth` |

---

## Environment Setup

### Required Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Groq API (for AI features)
VITE_GROQ_API_KEY=your_groq_api_key

# Google OAuth (optional, handled via Supabase)
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Supabase Configuration

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable Google OAuth in Authentication → Providers
3. Create required tables:
   - `profiles` (id, name, email, role, avatar, etc.)
   - `ideas` (id, title, description, status, created_by, etc.)
   - `notifications` (id, user_id, message, is_read, etc.)
   - `vc_applications` (for intro requests)
4. Set up Row Level Security (RLS) policies

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Awaneesh03/motif-website.git
cd motif-website

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run lint     # Run ESLint
npm run lint:fix # Auto-fix lint issues
npm run format   # Format with Prettier
```

---

## Deployment

### Vercel Configuration

The project is configured for Vercel via `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "vite"
}
```

### Deployment Process

1. Push to `master` branch on GitHub
2. Vercel automatically triggers a build
3. Build command: `npm run build` (Vite production build)
4. Output directory: `build/`
5. Preview deployments created for PRs

### Environment Variables on Vercel

Add the same environment variables from your `.env` file in Vercel's project settings under "Environment Variables".

---

## Debugging & Lessons Learned

### Issue: Duplicate Switch Case Clauses

**Problem:** TypeScript string enums compile to string literals. Using both `case UserRole.FOUNDER:` and `case 'founder':` created duplicate cases, causing Vite/esbuild build failures on Vercel.

**Solution:** Use only the enum values as the single source of truth. Never mix enum cases with string literal cases.

### Issue: Auth Loading State Race Conditions

**Problem:** Components tried to access `profile.role` before the profile was loaded, causing crashes.

**Solution:** `UserContext` exposes a `loading` state. All protected components check `loading` first and show a spinner until auth state is resolved.

### Issue: Profile Not Created for New Users

**Problem:** New OAuth users had no profile row, breaking role resolution.

**Solution:** `UserContext.loadUser()` auto-creates a default profile with `role: 'founder'` if none exists.

### Issue: Status Transition Bugs

**Problem:** Founders could bypass admin review by directly setting `approved_for_vc` status.

**Solution:** `statusValidation.ts` enforces valid state transitions. Founders can only go from `draft` → `pending_review`.

### Architectural Decisions

| Decision | Reason |
|----------|--------|
| String enums for roles | Matches database values, easy debugging |
| Role check in `ProtectedRoute` | Centralized, consistent protection |
| Separate layouts for Admin/VC | Clean separation, different nav/sidebar |
| Groq direct API call | No backend needed, faster iteration |

---

## Current Status

### ✅ Stable & Working

- Google OAuth authentication
- Role-based routing (Founder, VC, Admin)
- Founder dashboard with startup submission
- Admin approval/rejection flow
- VC browsing approved startups
- AI idea analysis via Groq
- Notifications system
- Case studies CRUD
- Vercel deployment (passing builds)

### 🔄 In Progress

- VC intro request end-to-end flow refinement
- Notification real-time updates
- Mobile responsiveness polish

### ⚠️ Known Limitations

- Some UI components have unused import warnings (non-blocking)
- Demo mode for non-configured Supabase environments needs improvement

---

## Future Improvements

### Planned Features

- Email notifications for status changes
- VC verification workflow
- Founder profile analytics
- Pitch deck file uploads
- Chat between founders and VCs
- Stripe integration for premium tiers

### Scaling Ideas

- Move AI analysis to edge functions for better performance
- Implement Supabase Realtime for live notifications
- Add rate limiting for AI endpoints
- Database indexing for startup queries

### Tech Improvements

- Migrate to Server Components for better SEO
- Add E2E tests with Playwright
- Implement error monitoring (Sentry)
- Add analytics (PostHog or Mixpanel)

---

## Author

Built by **Awaneesh Gupta**.

This project started as an idea to solve a real problem I observed in the startup ecosystem — founders struggling to get noticed, and VCs drowning in noise. Motif is my attempt to build a quality filter between the two.

It's been a journey of learning TypeScript deeply, debugging auth flows at 2 AM, and understanding why that one Vercel build keeps failing. Every bug taught me something. Every fix made the platform stronger.

This is not a finished product. It's a work in progress — just like any real startup.

---

## License

Private repository. All rights reserved.
