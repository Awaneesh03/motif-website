# Motif Three-Role Authentication & Access Control Architecture

**Version:** 1.0
**Date:** December 25, 2025
**Status:** Design Document

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Role Definitions](#role-definitions)
3. [Authentication Flow](#authentication-flow)
4. [Route Access Control Matrix](#route-access-control-matrix)
5. [Founder Experience](#founder-experience)
6. [Super Admin Dashboard](#super-admin-dashboard)
7. [VC Portal Architecture](#vc-portal-architecture)
8. [Technical Implementation](#technical-implementation)
9. [Backend Requirements](#backend-requirements)
10. [Security Considerations](#security-considerations)
11. [Migration Plan](#migration-plan)

---

## Executive Summary

Motif is transforming from a single-user platform into a **three-role ecosystem**:

- **Super Admin** (Internal team) - Full platform control
- **Founder** (Startup creators) - Idea validation, pitch creation, VC connection
- **VC/Investor** (Curated access) - Professional deal flow dashboard

**Key Design Principles:**
- ✅ One auth system, three experiences
- ✅ Role-based route protection at router level
- ✅ Separate VC portal with minimal, professional UX
- ✅ Zero cross-role data leakage
- ✅ Production-grade security with Supabase RLS

---

## Role Definitions

### 1. Super Admin (`super_admin`)

**Purpose:** Internal Motif team members with platform-wide control

**Capabilities:**
- View all users (founders + VCs + admins)
- View all startup submissions and scores
- Approve/reject startups for VC visibility
- Approve/remove VCs from platform
- Override matching algorithm
- View intro request pipeline
- Access platform analytics
- Manage content (case studies, resources)
- Control feature flags

**Access Level:** `FULL`

**Database Identifier:** `role = 'super_admin'`

**Assignment:** Manual (database-level only, cannot self-assign)

---

### 2. Founder (`founder`)

**Purpose:** Startup founders validating ideas and seeking funding

**Capabilities:**
- Complete profile onboarding
- Access Idea Analyzer (AI validation)
- Create pitch decks
- Join community discussions
- Request VC introductions (curated)
- View connection status
- Access learning resources
- Track saved ideas and case studies

**Cannot Access:**
- VC portal
- Other founders' private data
- Admin dashboard
- Direct VC browsing
- Matching algorithm details

**Access Level:** `STANDARD`

**Database Identifier:** `role = 'founder'`

**Assignment:** Default on signup OR self-selected during onboarding

---

### 3. VC/Investor (`vc`)

**Purpose:** External investors accessing curated deal flow

**Capabilities:**
- Set investment preferences (thesis, stage, geography)
- View matched startups only
- See startup readiness scores
- Request introductions
- Track intro pipeline
- Save deals for later
- Add private notes
- Download pitch decks

**Cannot Access:**
- Founder tools (Idea Analyzer, Pitch Creator)
- Community discussions
- Other VCs' activity
- Raw founder data
- Admin controls
- Unmatched/unqualified startups

**Access Level:** `RESTRICTED`

**Database Identifier:** `role = 'vc'`

**Assignment:** Application-based (requires admin approval)

---

## Authentication Flow

### Current State
```typescript
// Existing: Supabase Auth + UserProfile
interface UserProfile {
  id: string;
  email: string;
  role: string; // ← Currently empty, ready to use!
  // ... other fields
}
```

### Enhanced Flow

#### **Step 1: Signup**
```
User signs up via AuthPage
  ↓
Supabase creates auth.users record
  ↓
Trigger creates profiles record with role = 'founder' (default)
  ↓
UserContext loads profile
  ↓
Route to onboarding based on role
```

#### **Step 2: Role Assignment**

**For Founders (Default):**
```sql
INSERT INTO profiles (id, email, role, ...)
VALUES (auth.uid(), email, 'founder', ...);
```

**For VCs (Application-Based):**
```
VC applies via special form (/apply-as-vc)
  ↓
Creates profile with role = 'vc_pending'
  ↓
Admin reviews application
  ↓
Admin approves → role = 'vc'
  ↓
VC gets email invitation to complete profile
```

**For Super Admins (Manual):**
```sql
-- Database-level only
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'admin@motif.com';
```

#### **Step 3: Login & Routing**
```
User logs in
  ↓
UserContext loads profile with role
  ↓
App.tsx checks role:
  - super_admin → /admin/dashboard
  - founder → /dashboard
  - vc → /vc/dashboard
  - vc_pending → /vc/pending (pending approval page)
```

---

## Route Access Control Matrix

| Route | Founder | VC | Super Admin | Public | Notes |
|-------|---------|----|----|--------|-------|
| **PUBLIC ROUTES** |
| `/` | ✅ | ✅ | ✅ | ✅ | Home page |
| `/about` | ✅ | ✅ | ✅ | ✅ | About Motif |
| `/features` | ✅ | ✅ | ✅ | ✅ | Platform features |
| `/pricing` | ✅ | ❌ | ✅ | ✅ | Founder pricing (hide from VCs) |
| `/contact` | ✅ | ✅ | ✅ | ✅ | Contact form |
| `/auth` | ✅ | ✅ | ✅ | ✅ | Login/Signup |
| `/apply-as-vc` | ✅ | ✅ | ✅ | ✅ | VC application form |
| **FOUNDER ROUTES** |
| `/dashboard` | ✅ | ❌ | ✅ | ❌ | Founder dashboard |
| `/profile` | ✅ | ❌ | ✅ | ❌ | Founder profile |
| `/idea-analyser` | ✅ | ❌ | ✅ | ❌ | AI idea validation |
| `/pitch-creator` | ✅ | ❌ | ✅ | ❌ | Pitch deck generator |
| `/saved-ideas` | ✅ | ❌ | ✅ | ❌ | Saved ideas |
| `/community` | ✅ | ❌ | ✅ | ❌ | Community forum |
| `/resources` | ✅ | ❌ | ✅ | ❌ | Learning resources |
| `/get-funded` | ✅ | ❌ | ✅ | ❌ | VC connection request |
| `/membership` | ✅ | ❌ | ✅ | ❌ | Membership tiers |
| `/case-studies` | ✅ | ❌ | ✅ | ✅ | Case studies (optionally public) |
| **VC ROUTES** |
| `/vc/dashboard` | ❌ | ✅ | ✅ | ❌ | VC deal flow dashboard |
| `/vc/profile` | ❌ | ✅ | ✅ | ❌ | VC profile settings |
| `/vc/preferences` | ❌ | ✅ | ✅ | ❌ | Investment preferences |
| `/vc/startups` | ❌ | ✅ | ✅ | ❌ | Matched startups list |
| `/vc/startups/:id` | ❌ | ✅ | ✅ | ❌ | Startup detail view |
| `/vc/intros` | ❌ | ✅ | ✅ | ❌ | Introduction pipeline |
| `/vc/saved` | ❌ | ✅ | ✅ | ❌ | Saved startups |
| `/vc/pending` | ❌ | ✅* | ✅ | ❌ | Pending approval page (vc_pending only) |
| **ADMIN ROUTES** |
| `/admin/dashboard` | ❌ | ❌ | ✅ | ❌ | Admin control panel |
| `/admin/users` | ❌ | ❌ | ✅ | ❌ | User management |
| `/admin/startups` | ❌ | ❌ | ✅ | ❌ | Startup approval queue |
| `/admin/vcs` | ❌ | ❌ | ✅ | ❌ | VC approval queue |
| `/admin/matching` | ❌ | ❌ | ✅ | ❌ | Matching algorithm config |
| `/admin/intros` | ❌ | ❌ | ✅ | ❌ | Intro request management |
| `/admin/analytics` | ❌ | ❌ | ✅ | ❌ | Platform metrics |

**Legend:**
- ✅ = Full access
- ❌ = Access denied (redirect)
- ✅* = Conditional access

**Redirect Rules:**
- Unauthenticated users trying to access protected routes → `/auth`
- Founder trying to access VC routes → `/dashboard` (with toast: "Access denied")
- VC trying to access Founder routes → `/vc/dashboard` (with toast: "Access denied")
- Non-admin trying to access admin routes → Role-appropriate dashboard (with error logged)

---

## Founder Experience

### Onboarding Flow
```
1. Sign up via /auth
2. Email verification (Supabase)
3. Profile completion form:
   - Name
   - Location
   - Education
   - Startup goals (multi-select)
   - LinkedIn URL
4. Welcome tour (interactive guide)
5. Redirect to /dashboard
```

### Founder Dashboard
**Layout:** `<FounderLayout>` (Navbar + Footer + Chatbot)

**Dashboard Sections:**
1. **Profile Summary**
   - Avatar, name, role badge
   - Connections count
   - Ideas saved count
   - Quick links: Edit Profile, View Activity

2. **Recent Activity**
   - Last idea analyzed
   - Last pitch created
   - Recent community posts
   - VC connection status

3. **Quick Actions**
   - Analyze New Idea
   - Create Pitch
   - Browse Case Studies
   - Join Community

4. **Stats Cards**
   - Ideas Analyzed
   - Pitches Created
   - Community Engagement Score
   - VC Intro Requests (status)

### Key Pages

#### Idea Analyzer (`/idea-analyser`)
- AI-powered idea validation
- Score visualization (viability, market, execution)
- Actionable feedback
- Save for later

#### Pitch Creator (`/pitch-creator`)
- Multi-step pitch builder
- AI-generated content suggestions
- Live preview
- Export as PDF/PPTX

#### VC Connection (`/get-funded`)
- **NOT a VC directory**
- Request introduction form:
  - Startup summary
  - Stage
  - Ask amount
  - Pitch deck upload
- Motif team reviews → matches with VCs → facilitates intro
- Status tracking: Submitted → Under Review → Matched → Intro Sent → Meeting Scheduled

#### Community (`/community`)
- Discussion forums
- Founder-to-founder Q&A
- No VCs (private founder space)

---

## Super Admin Dashboard

### Admin Layout
**Separate Layout:** `<AdminLayout>` with admin-specific navigation

**Color Scheme:** Dark theme with accent colors for urgency (red = pending approvals)

### Dashboard Structure

#### **1. Overview Tab (`/admin/dashboard`)**
**Key Metrics Cards:**
- Total Users (breakdown: founders, VCs, admins)
- Active Startups (last 30 days)
- Pending VC Applications
- Pending Startup Approvals
- Intro Requests (this week)
- Platform Health Score

**Charts:**
- User growth (line chart)
- Idea analysis volume (bar chart)
- VC matching success rate (pie chart)

**Recent Activity Feed:**
- New user signups
- VC applications
- Intro requests
- System alerts

---

#### **2. Users Tab (`/admin/users`)**

**User Table:**
| Name | Email | Role | Status | Joined | Actions |
|------|-------|------|--------|--------|---------|
| John Doe | john@... | founder | active | 2025-01-15 | View • Edit • Suspend |

**Filters:**
- Role: All / Founder / VC / Admin
- Status: All / Active / Suspended / Pending
- Date range

**Actions:**
- View full profile
- Change role (with confirmation)
- Suspend/unsuspend account
- Send notification
- View activity log

---

#### **3. Startups Tab (`/admin/startups`)**

**Approval Queue:**
- List of startups requesting VC visibility
- Each row shows:
  - Startup name
  - Founder name
  - Stage
  - Industry
  - Readiness score
  - Submission date
  - Actions: Approve / Reject / View Details

**Approved Startups:**
- Table of live startups visible to VCs
- Sort by: Readiness score, Date approved, Views by VCs
- Actions: Unpublish, Edit, View Analytics

**Detail View Modal:**
- Full startup profile
- Validation scores
- Pitch deck preview
- Founder info
- Approval notes field
- Approve/Reject buttons

---

#### **4. VCs Tab (`/admin/vcs`)**

**VC Application Queue:**
| VC Name | Email | Firm | Status | Applied | Actions |
|---------|-------|------|--------|---------|---------|
| Jane Smith | jane@... | Acme VC | pending | 2025-12-20 | Review • Approve • Reject |

**Application Detail View:**
- VC bio
- Investment thesis
- Stage focus (Seed, Series A, etc.)
- Cheque size range
- Geography preference
- Industry focus
- LinkedIn/Website verification
- Admin notes field
- Approve/Reject/Request More Info

**Approved VCs:**
- Table of active VCs
- Columns: Name, Firm, Deals Viewed, Intros Requested, Status
- Actions: Suspend, Edit Preferences, View Activity

---

#### **5. Matching Tab (`/admin/matching`)**

**Algorithm Configuration:**
- Matching criteria weights:
  - Industry match weight (slider)
  - Stage match weight
  - Geography match weight
  - Readiness score threshold
- Test matching (input startup + VC to see score)

**Match Override:**
- Manually create startup-VC pairing
- Bypass algorithm for special cases
- Add override reason (logged)

---

#### **6. Intros Tab (`/admin/intros`)**

**Intro Pipeline:**
| Startup | VC | Status | Requested | Actions |
|---------|-------|--------|-----------|---------|
| Startup A | VC Firm X | pending | 2025-12-22 | Approve • Reject • View |

**Statuses:**
- `requested` - VC wants intro
- `pending_review` - Admin reviewing
- `approved` - Admin approved, email sent
- `rejected` - Admin rejected (with reason)
- `meeting_scheduled` - Parties connected
- `closed_won` - Deal made
- `closed_lost` - No deal

**Actions:**
- Approve intro (sends email to both parties)
- Reject intro (with private reason to VC)
- View conversation history
- Mark outcome (won/lost/in-progress)

---

#### **7. Analytics Tab (`/admin/analytics`)**

**Reports:**
- User engagement (DAU/MAU)
- Idea analysis completion rate
- Pitch deck creation rate
- VC matching accuracy
- Intro-to-meeting conversion rate
- Revenue metrics (if monetized)

**Export:**
- CSV export for all reports
- Date range filters

---

## VC Portal Architecture

### Design Philosophy
**Professional. Minimal. Signal > Noise.**

Think: **Crunchbase Pro** meets **AngelList** - clean, data-dense, no fluff.

---

### VC Layout (`<VCLayout>`)

**Navigation:**
```
┌─────────────────────────────────────────────┐
│ [Motif Logo]    Dashboard  Startups  Intros │  [Profile] [Settings] [Logout]
└─────────────────────────────────────────────┘
```

**No Navbar extras:**
- No community link
- No pricing link
- No resources dropdown
- No chatbot (professional environment)
- No theme toggle (default: clean light theme)

**Footer:**
- Minimal: Terms • Privacy • Contact • Logout
- No marketing content

---

### VC Routes & Pages

#### **1. VC Onboarding (`/vc/onboarding`)**

**First-time login flow:**

**Step 1: Investment Preferences**
```
┌──────────────────────────────────────────┐
│ Set Your Investment Preferences          │
├──────────────────────────────────────────┤
│ Industry Focus: (multi-select)           │
│ □ SaaS  □ FinTech  □ HealthTech          │
│ □ AI/ML  □ E-commerce  □ Other           │
│                                          │
│ Stage Preference:                        │
│ ○ Pre-seed  ○ Seed  ○ Series A  ○ Series B+ │
│                                          │
│ Cheque Size: $______ to $______          │
│                                          │
│ Geography:                               │
│ □ North America  □ Europe  □ Asia        │
│                                          │
│ Investment Thesis: (text area)           │
│ ______________________________________   │
│                                          │
│ [Save & Continue]                        │
└──────────────────────────────────────────┘
```

**Step 2: Profile Details**
- Firm name
- Your role (Partner, Associate, etc.)
- Bio (100-500 words)
- LinkedIn URL
- Website URL

**Step 3: Confirmation**
- Review preferences
- Start viewing matches

---

#### **2. VC Dashboard (`/vc/dashboard`)**

**Hero Stats Row:**
```
┌─────────────────────────────────────────────────────────┐
│  📊 New Matches: 12   |   📩 Pending Intros: 3   |   ⭐ Saved: 8  │
└─────────────────────────────────────────────────────────┘
```

**Main Section: Matched Startups Feed**

**Startup Card Example:**
```
┌───────────────────────────────────────────────────────┐
│ ⭐ [Save]                                 [Request Intro] │
│                                                         │
│ **Startup Name**                      Investor Readiness: ●●●●○ │
│ "One-line pitch goes here"                              │
│                                                         │
│ 📍 San Francisco, CA  •  Stage: Seed  •  Ask: $2M      │
│ 🏷️ SaaS, FinTech                                       │
│                                                         │
│ Why this matches your thesis:                          │
│ "Aligns with your SaaS focus and seed-stage preference.│
│  Strong product-market fit signals."                   │
│                                                         │
│ [View Full Profile →]                                  │
└───────────────────────────────────────────────────────┘
```

**Filters (Left Sidebar):**
- Stage: All / Pre-seed / Seed / Series A
- Industry: (checkboxes)
- Geography: (checkboxes)
- Readiness Score: 1-5 stars
- Sort by: Newest / Highest Score / Best Match

**Empty State:**
```
No startups match your preferences yet.

[Adjust Preferences] or check back soon.
```

---

#### **3. Startup Detail View (`/vc/startups/:id`)**

**Layout: Two-column**

**Left Column (Main Content):**

**Section 1: Startup Overview**
- Startup name
- One-line pitch
- Logo/image
- Location
- Website
- Stage, Ask amount, Valuation (if disclosed)

**Section 2: Founder Info**
- Founder name(s)
- LinkedIn links
- Education
- Previous experience
- Team size

**Section 3: The Problem**
- Problem statement
- Market pain points
- Current solutions & gaps

**Section 4: The Solution**
- Product/service description
- Unique value proposition
- Competitive advantage

**Section 5: Market Opportunity**
- TAM/SAM/SOM
- Market trends
- Target customer profile

**Section 6: Business Model**
- Revenue model
- Pricing strategy
- Unit economics (if available)

**Section 7: Traction Signals**
- Revenue (if disclosed)
- User growth
- Key partnerships
- Press mentions
- Validation metrics

**Section 8: Pitch Deck**
- Embedded PDF viewer OR
- Download button
- Preview thumbnails

**Section 9: Motif Evaluation Summary**
- Overall readiness score: ⭐⭐⭐⭐☆ (4/5)
- Breakdown:
  - Idea Viability: 4.2/5
  - Market Opportunity: 4.5/5
  - Execution Capability: 3.8/5
  - Founder Strength: 4.0/5
- AI-generated summary (from Idea Analyzer)

---

**Right Column (Sticky Sidebar):**

**Action Panel:**
```
┌─────────────────────────────┐
│ [⭐ Save for Later]         │
│ [📩 Request Introduction]   │
│ [✖ Pass]                    │
├─────────────────────────────┤
│ Your Notes (Private):       │
│ ________________________    │
│ [Save Note]                 │
└─────────────────────────────┘
```

**Match Score:**
```
Why this matches your thesis:
● SaaS vertical (your focus)
● Seed stage (your preference)
● North America (your geography)
● High readiness score

Match confidence: 92%
```

---

#### **4. Intro Request Flow**

**When VC clicks "Request Introduction":**

**Modal:**
```
┌──────────────────────────────────────────┐
│ Request Introduction to [Startup Name]   │
├──────────────────────────────────────────┤
│ Your message to the founder:             │
│ (optional, max 500 chars)                │
│ ______________________________________   │
│                                          │
│ What specific value can you add?         │
│ (helps admin approve)                    │
│ ______________________________________   │
│                                          │
│ ☑ I confirm I'm genuinely interested    │
│                                          │
│ [Cancel]              [Send Request →]  │
└──────────────────────────────────────────┘
```

**Post-request:**
- Toast: "Intro request sent! We'll review and notify you."
- Card updates to show "Intro Requested" badge
- Moves to "Pending Intros" section

---

#### **5. Intros Tab (`/vc/intros`)**

**Pipeline View:**

```
┌────────────────────────────────────────────────────┐
│ Pending (3)  |  Approved (5)  |  Meetings (2)  |  Archive (12) │
└────────────────────────────────────────────────────┘

┌─── PENDING ────────────────────────────────────────┐
│ Startup A                          Requested: 2d ago│
│ "AI-powered fintech platform"                      │
│ Status: Under admin review                         │
└───────────────────────────────────────────────────┘

┌─── APPROVED ───────────────────────────────────────┐
│ Startup B                          Approved: 5d ago │
│ "Healthcare SaaS solution"                         │
│ Status: Intro email sent. Awaiting founder response│
│ [View Email Thread]                                │
└───────────────────────────────────────────────────┘

┌─── MEETINGS ───────────────────────────────────────┐
│ Startup C                          Meeting: Tomorrow│
│ "E-commerce platform"                              │
│ Status: Meeting scheduled for Dec 26, 2pm EST     │
│ [Add to Calendar] [View Details]                  │
└───────────────────────────────────────────────────┘
```

**Archive:**
- Closed deals (won/lost)
- Passed intros
- Expired requests

---

#### **6. Saved Startups (`/vc/saved`)**

**List of saved startups:**
- Same card design as dashboard
- Remove from saved option
- Sort by: Date saved, Readiness score

---

#### **7. VC Profile Settings (`/vc/profile`)**

**Tabs:**

**Profile Tab:**
- Edit name, bio, firm
- Change avatar
- Update LinkedIn/website

**Preferences Tab:**
- Edit investment preferences (same as onboarding)
- Update thesis keywords

**Notifications Tab:**
- Email preferences:
  - New match alerts
  - Intro status updates
  - Weekly digest

**Account Tab:**
- Change password
- Logout from all devices
- Delete account

---

### What VCs CANNOT See

**Explicitly Hidden:**
- ❌ Community posts
- ❌ Idea Analyzer tool
- ❌ Pitch Creator tool
- ❌ Founder dashboards
- ❌ Other VCs' profiles or activity
- ❌ Unmatched startups (only see their matches)
- ❌ Raw founder contact info (until intro approved)
- ❌ Pricing pages (VCs don't pay founders do)
- ❌ Case studies (optional - admin decides)
- ❌ Learning resources
- ❌ Chatbot

---

## Technical Implementation

### 1. Type Definitions (`src/types/roles.ts`)

```typescript
// Role enum
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  FOUNDER = 'founder',
  VC = 'vc',
  VC_PENDING = 'vc_pending', // VC awaiting approval
}

// Extended UserProfile interface
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: UserRole;

  // Founder-specific fields
  about?: string;
  linkedin?: string;
  location?: string;
  education?: string;
  startup_goals?: string[];

  // VC-specific fields
  firm_name?: string;
  vc_role?: string; // Partner, Associate, etc.
  bio?: string;
  investment_thesis?: string;
  stage_preferences?: string[]; // ['seed', 'series_a']
  industry_preferences?: string[]; // ['saas', 'fintech']
  geography_preferences?: string[]; // ['north_america']
  cheque_size_min?: number;
  cheque_size_max?: number;

  // Common fields
  connections: number;
  ideasSaved: number;
  caseStudiesSaved: number;
  created_at: string;
  updated_at: string;
}

// Permission helper
export const hasAccess = (
  userRole: UserRole | undefined,
  allowedRoles: UserRole[]
): boolean => {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
};

// Route permission config
export interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
  redirectOnFail: string;
}
```

---

### 2. Route Protection (`src/components/ProtectedRoute.tsx`)

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { UserRole, hasAccess } from '@/types/roles';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo,
}) => {
  const { user, profile, loading } = useUser();
  const location = useLocation();

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // No profile loaded
  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  // Check role access
  if (!hasAccess(profile.role as UserRole, allowedRoles)) {
    // Toast notification
    toast.error('Access denied. You do not have permission to view this page.');

    // Redirect based on user role
    const fallbackRedirect = redirectTo || getRoleDefaultRoute(profile.role as UserRole);
    return <Navigate to={fallbackRedirect} replace />;
  }

  // Authorized
  return <>{children}</>;
};

// Helper: Get default route for each role
const getRoleDefaultRoute = (role: UserRole): string => {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return '/admin/dashboard';
    case UserRole.FOUNDER:
      return '/dashboard';
    case UserRole.VC:
      return '/vc/dashboard';
    case UserRole.VC_PENDING:
      return '/vc/pending';
    default:
      return '/';
  }
};
```

---

### 3. App Router Updates (`src/App.tsx`)

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserRole } from '@/types/roles';

// Layouts
import { MainLayout } from '@/layouts/MainLayout';
import { VCLayout } from '@/layouts/VCLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

// Pages (existing)
import HomePage from '@/components/pages/HomePage';
// ... other imports

// New VC Pages
import VCDashboard from '@/components/pages/vc/VCDashboard';
import VCOnboarding from '@/components/pages/vc/VCOnboarding';
import VCStartups from '@/components/pages/vc/VCStartups';
import VCStartupDetail from '@/components/pages/vc/VCStartupDetail';
import VCIntros from '@/components/pages/vc/VCIntros';
import VCSaved from '@/components/pages/vc/VCSaved';
import VCProfile from '@/components/pages/vc/VCProfile';
import VCPending from '@/components/pages/vc/VCPending';

// New Admin Pages
import AdminDashboard from '@/components/pages/admin/AdminDashboard';
import AdminUsers from '@/components/pages/admin/AdminUsers';
import AdminStartups from '@/components/pages/admin/AdminStartups';
import AdminVCs from '@/components/pages/admin/AdminVCs';
import AdminMatching from '@/components/pages/admin/AdminMatching';
import AdminIntros from '@/components/pages/admin/AdminIntros';
import AdminAnalytics from '@/components/pages/admin/AdminAnalytics';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/apply-as-vc" element={<VCApplicationPage />} />
        </Route>

        {/* FOUNDER ROUTES */}
        <Route element={<MainLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/idea-analyser"
            element={
              <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                <IdeaAnalyserPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pitch-creator"
            element={
              <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                <PitchCreatorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                <CommunityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                <ResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/get-funded"
            element={
              <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                <VCConnectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/saved-ideas"
            element={
              <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                <SavedIdeasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/membership"
            element={
              <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                <MembershipPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* VC ROUTES */}
        <Route element={<VCLayout />}>
          <Route
            path="/vc/dashboard"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC, UserRole.SUPER_ADMIN]}>
                <VCDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vc/onboarding"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC]}>
                <VCOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vc/startups"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC, UserRole.SUPER_ADMIN]}>
                <VCStartups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vc/startups/:id"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC, UserRole.SUPER_ADMIN]}>
                <VCStartupDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vc/intros"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC, UserRole.SUPER_ADMIN]}>
                <VCIntros />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vc/saved"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC, UserRole.SUPER_ADMIN]}>
                <VCSaved />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vc/profile"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC, UserRole.SUPER_ADMIN]}>
                <VCProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vc/pending"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC_PENDING]}>
                <VCPending />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* ADMIN ROUTES */}
        <Route element={<AdminLayout />}>
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/startups"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <AdminStartups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vcs"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <AdminVCs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/matching"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <AdminMatching />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/intros"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <AdminIntros />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN]}>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

### 4. Layouts

#### **VCLayout (`src/layouts/VCLayout.tsx`)**
```typescript
import { Outlet } from 'react-router-dom';
import { VCNavbar } from '@/components/vc/VCNavbar';
import { VCFooter } from '@/components/vc/VCFooter';

export const VCLayout = () => {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <VCNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <VCFooter />
    </div>
  );
};
```

**VCNavbar:**
- Minimal navigation: Dashboard, Startups, Intros
- Right side: Profile dropdown (Settings, Logout)
- No extra links (no community, resources, etc.)
- Clean, professional design

---

#### **AdminLayout (`src/layouts/AdminLayout.tsx`)**
```typescript
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export const AdminLayout = () => {
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
```

**AdminSidebar:**
- Dark theme
- Navigation: Dashboard, Users, Startups, VCs, Matching, Intros, Analytics
- Badges for pending items (e.g., "3" next to VCs for pending approvals)

---

### 5. UserContext Updates (`src/contexts/UserContext.tsx`)

**Add role-based helpers:**

```typescript
// In UserContext.tsx
export interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  // New helpers:
  isFounder: boolean;
  isVC: boolean;
  isAdmin: boolean;
  hasRole: (role: UserRole) => boolean;
}

// In UserProvider:
const isFounder = profile?.role === UserRole.FOUNDER;
const isVC = profile?.role === UserRole.VC;
const isAdmin = profile?.role === UserRole.SUPER_ADMIN;

const hasRole = (role: UserRole) => profile?.role === role;

// Return in context value:
return (
  <UserContext.Provider
    value={{
      user,
      profile,
      loading,
      isFounder,
      isVC,
      isAdmin,
      hasRole,
    }}
  >
    {children}
  </UserContext.Provider>
);
```

---

### 6. Role-Based Component Rendering

**Example: Navbar**
```typescript
// In Navbar.tsx
import { useUser } from '@/contexts/UserContext';

const Navbar = () => {
  const { isFounder, isVC, isAdmin } = useUser();

  return (
    <nav>
      {/* Always show */}
      <Link to="/">Home</Link>

      {/* Founder-only */}
      {isFounder && (
        <>
          <Link to="/community">Community</Link>
          <Link to="/idea-analyser">Idea Analyzer</Link>
        </>
      )}

      {/* VC-only */}
      {isVC && (
        <>
          <Link to="/vc/startups">Startups</Link>
          <Link to="/vc/intros">Intros</Link>
        </>
      )}

      {/* Admin-only */}
      {isAdmin && <Link to="/admin/dashboard">Admin</Link>}
    </nav>
  );
};
```

---

## Backend Requirements

### Database Schema Changes

#### **1. Update `profiles` table**

```sql
-- Modify existing role column
ALTER TABLE profiles
ALTER COLUMN role TYPE VARCHAR(20);

-- Add check constraint
ALTER TABLE profiles
ADD CONSTRAINT role_check
CHECK (role IN ('super_admin', 'founder', 'vc', 'vc_pending'));

-- Set default role
ALTER TABLE profiles
ALTER COLUMN role SET DEFAULT 'founder';

-- Add VC-specific columns
ALTER TABLE profiles
ADD COLUMN firm_name VARCHAR(255),
ADD COLUMN vc_role VARCHAR(100),
ADD COLUMN bio TEXT,
ADD COLUMN investment_thesis TEXT,
ADD COLUMN stage_preferences JSONB DEFAULT '[]'::jsonb,
ADD COLUMN industry_preferences JSONB DEFAULT '[]'::jsonb,
ADD COLUMN geography_preferences JSONB DEFAULT '[]'::jsonb,
ADD COLUMN cheque_size_min INTEGER,
ADD COLUMN cheque_size_max INTEGER;

-- Add timestamps
ALTER TABLE profiles
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approved_by UUID REFERENCES profiles(id);
```

---

#### **2. Create `startups` table**

```sql
CREATE TABLE startups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Basic info
  name VARCHAR(255) NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT,
  website VARCHAR(500),
  logo_url TEXT,

  -- Details
  stage VARCHAR(50) CHECK (stage IN ('pre_seed', 'seed', 'series_a', 'series_b', 'series_c+')),
  industry VARCHAR(100),
  location VARCHAR(255),
  ask_amount INTEGER,
  valuation INTEGER,

  -- Content
  problem TEXT,
  solution TEXT,
  market_opportunity TEXT,
  business_model TEXT,
  traction TEXT,
  pitch_deck_url TEXT,

  -- Motif scores
  readiness_score NUMERIC(3, 2) CHECK (readiness_score >= 0 AND readiness_score <= 5),
  idea_viability_score NUMERIC(3, 2),
  market_score NUMERIC(3, 2),
  execution_score NUMERIC(3, 2),
  founder_score NUMERIC(3, 2),

  -- Status
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected')),
  approved_for_vc BOOLEAN DEFAULT FALSE,

  -- Admin
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_startups_founder ON startups(founder_id);
CREATE INDEX idx_startups_status ON startups(status);
CREATE INDEX idx_startups_approved ON startups(approved_for_vc);
CREATE INDEX idx_startups_stage ON startups(stage);
CREATE INDEX idx_startups_industry ON startups(industry);

-- RLS
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;

-- Founders can view/edit their own startups
CREATE POLICY "Founders can manage own startups"
ON startups FOR ALL
USING (founder_id = auth.uid());

-- VCs can view approved startups only
CREATE POLICY "VCs can view approved startups"
ON startups FOR SELECT
USING (
  approved_for_vc = TRUE
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'vc'
  )
);

-- Admins can view all
CREATE POLICY "Admins can view all startups"
ON startups FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
```

---

#### **3. Create `vc_startup_matches` table**

```sql
CREATE TABLE vc_startup_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vc_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,

  -- Match details
  match_score NUMERIC(4, 2), -- 0-100
  match_reason TEXT, -- Why this is a good match

  -- VC actions
  saved BOOLEAN DEFAULT FALSE,
  passed BOOLEAN DEFAULT FALSE,
  private_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(vc_id, startup_id)
);

CREATE INDEX idx_matches_vc ON vc_startup_matches(vc_id);
CREATE INDEX idx_matches_startup ON vc_startup_matches(startup_id);
CREATE INDEX idx_matches_saved ON vc_startup_matches(vc_id, saved) WHERE saved = TRUE;

-- RLS
ALTER TABLE vc_startup_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "VCs can manage own matches"
ON vc_startup_matches FOR ALL
USING (vc_id = auth.uid());

CREATE POLICY "Admins can view all matches"
ON vc_startup_matches FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
```

---

#### **4. Create `intro_requests` table**

```sql
CREATE TABLE intro_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vc_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,

  -- Request details
  vc_message TEXT,
  vc_value_add TEXT,

  -- Status
  status VARCHAR(50) DEFAULT 'requested' CHECK (status IN (
    'requested',
    'pending_review',
    'approved',
    'rejected',
    'intro_sent',
    'meeting_scheduled',
    'closed_won',
    'closed_lost'
  )),

  -- Admin review
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  rejection_reason TEXT,

  -- Outcome
  outcome VARCHAR(50),
  outcome_notes TEXT,

  -- Timestamps
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  intro_sent_at TIMESTAMP WITH TIME ZONE,
  meeting_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(vc_id, startup_id)
);

CREATE INDEX idx_intros_vc ON intro_requests(vc_id);
CREATE INDEX idx_intros_startup ON intro_requests(startup_id);
CREATE INDEX idx_intros_status ON intro_requests(status);

-- RLS
ALTER TABLE intro_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "VCs can view own requests"
ON intro_requests FOR ALL
USING (vc_id = auth.uid());

CREATE POLICY "Founders can view requests for their startups"
ON intro_requests FOR SELECT
USING (
  startup_id IN (
    SELECT id FROM startups WHERE founder_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all requests"
ON intro_requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
```

---

#### **5. Create `vc_applications` table**

```sql
CREATE TABLE vc_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Applicant info
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  firm_name VARCHAR(255) NOT NULL,
  vc_role VARCHAR(100),
  linkedin_url VARCHAR(500),
  website_url VARCHAR(500),

  -- Application details
  bio TEXT,
  investment_thesis TEXT,
  stage_preferences JSONB DEFAULT '[]'::jsonb,
  industry_preferences JSONB DEFAULT '[]'::jsonb,
  geography_preferences JSONB DEFAULT '[]'::jsonb,
  cheque_size_min INTEGER,
  cheque_size_max INTEGER,

  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Admin review
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  rejection_reason TEXT,

  -- Timestamps
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vc_apps_status ON vc_applications(status);
CREATE INDEX idx_vc_apps_email ON vc_applications(email);

-- RLS
ALTER TABLE vc_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (apply)
CREATE POLICY "Anyone can apply as VC"
ON vc_applications FOR INSERT
WITH CHECK (TRUE);

-- Applicants can view own application
CREATE POLICY "Applicants can view own application"
ON vc_applications FOR SELECT
USING (email = auth.jwt() ->> 'email');

-- Admins can manage all
CREATE POLICY "Admins can manage applications"
ON vc_applications FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
```

---

### Backend API Endpoints (Spring Boot)

#### **Auth & User Endpoints**

```java
// UserController.java

@GetMapping("/api/users/me")
public UserProfile getCurrentUser() {
  // Return current user profile with role
}

@PutMapping("/api/users/me")
public UserProfile updateProfile(@RequestBody UserProfile profile) {
  // Update profile (validate role cannot be self-changed)
}

@PostMapping("/api/users/me/onboarding")
public void completeOnboarding(@RequestBody OnboardingData data) {
  // Mark onboarding as complete
}
```

---

#### **Admin Endpoints**

```java
// AdminController.java

@PreAuthorize("hasRole('SUPER_ADMIN')")
@GetMapping("/api/admin/stats")
public AdminStats getStats() {
  // Return platform stats
}

@PreAuthorize("hasRole('SUPER_ADMIN')")
@GetMapping("/api/admin/users")
public Page<UserProfile> getUsers(@RequestParam filters...) {
  // Return paginated users with filters
}

@PreAuthorize("hasRole('SUPER_ADMIN')")
@PutMapping("/api/admin/users/{id}/role")
public void updateUserRole(@PathVariable UUID id, @RequestParam String role) {
  // Change user role (with audit log)
}

@PreAuthorize("hasRole('SUPER_ADMIN')")
@GetMapping("/api/admin/startups/pending")
public List<Startup> getPendingStartups() {
  // Return startups pending approval
}

@PreAuthorize("hasRole('SUPER_ADMIN')")
@PostMapping("/api/admin/startups/{id}/approve")
public void approveStartup(@PathVariable UUID id) {
  // Approve startup for VC visibility
}

@PreAuthorize("hasRole('SUPER_ADMIN')")
@PostMapping("/api/admin/startups/{id}/reject")
public void rejectStartup(@PathVariable UUID id, @RequestParam String reason) {
  // Reject startup
}

@PreAuthorize("hasRole('SUPER_ADMIN')")
@GetMapping("/api/admin/vc-applications")
public List<VCApplication> getVCApplications() {
  // Return VC applications
}

@PreAuthorize("hasRole('SUPER_ADMIN')")
@PostMapping("/api/admin/vc-applications/{id}/approve")
public void approveVC(@PathVariable UUID id) {
  // Approve VC → create profile with role='vc', send email
}

@PreAuthorize("hasRole('SUPER_ADMIN')")
@GetMapping("/api/admin/intros")
public List<IntroRequest> getIntroRequests() {
  // Return intro requests
}

@PreAuthorize("hasRole('SUPER_ADMIN')")
@PostMapping("/api/admin/intros/{id}/approve")
public void approveIntro(@PathVariable UUID id) {
  // Approve intro → send email to both parties
}
```

---

#### **Founder Endpoints**

```java
// StartupController.java

@PreAuthorize("hasRole('FOUNDER')")
@PostMapping("/api/startups")
public Startup createStartup(@RequestBody Startup startup) {
  // Create startup for current user
}

@PreAuthorize("hasRole('FOUNDER')")
@PutMapping("/api/startups/{id}")
public Startup updateStartup(@PathVariable UUID id, @RequestBody Startup startup) {
  // Update own startup only
}

@PreAuthorize("hasRole('FOUNDER')")
@GetMapping("/api/startups/mine")
public List<Startup> getMyStartups() {
  // Return current user's startups
}

@PreAuthorize("hasRole('FOUNDER')")
@PostMapping("/api/startups/{id}/submit-for-review")
public void submitForReview(@PathVariable UUID id) {
  // Submit startup for admin review
}

@PreAuthorize("hasRole('FOUNDER')")
@GetMapping("/api/intros/mine")
public List<IntroRequest> getMyIntroRequests() {
  // Return intro requests for my startups
}
```

---

#### **VC Endpoints**

```java
// VCController.java

@PreAuthorize("hasRole('VC')")
@GetMapping("/api/vc/matches")
public List<StartupMatch> getMatches(@RequestParam filters...) {
  // Return startups matched to VC preferences
}

@PreAuthorize("hasRole('VC')")
@GetMapping("/api/vc/startups/{id}")
public Startup getStartupDetail(@PathVariable UUID id) {
  // Return startup detail if matched to VC
  // Validate VC has access to this startup
}

@PreAuthorize("hasRole('VC')")
@PostMapping("/api/vc/startups/{id}/save")
public void saveStartup(@PathVariable UUID id) {
  // Save startup for later
}

@PreAuthorize("hasRole('VC')")
@PostMapping("/api/vc/startups/{id}/pass")
public void passStartup(@PathVariable UUID id) {
  // Mark as passed
}

@PreAuthorize("hasRole('VC')")
@PostMapping("/api/vc/startups/{id}/request-intro")
public IntroRequest requestIntro(
  @PathVariable UUID id,
  @RequestBody IntroRequestData data
) {
  // Create intro request
}

@PreAuthorize("hasRole('VC')")
@GetMapping("/api/vc/intros")
public List<IntroRequest> getMyIntros() {
  // Return VC's intro requests
}

@PreAuthorize("hasRole('VC')")
@PutMapping("/api/vc/preferences")
public void updatePreferences(@RequestBody VCPreferences prefs) {
  // Update VC investment preferences
}

@PreAuthorize("hasRole('VC')")
@PostMapping("/api/vc/startups/{id}/note")
public void saveNote(@PathVariable UUID id, @RequestParam String note) {
  // Save private note
}
```

---

#### **Matching Algorithm (Background Job)**

```java
// MatchingService.java

@Scheduled(cron = "0 0 2 * * *") // Daily at 2 AM
public void runMatchingAlgorithm() {
  // For each approved startup:
  //   For each VC:
  //     Calculate match score based on:
  //       - Industry overlap
  //       - Stage match
  //       - Geography match
  //       - Readiness score threshold
  //       - Investment thesis keywords
  //     If score > threshold:
  //       Create/update vc_startup_matches record
  //       Send notification to VC if new match
}

private double calculateMatchScore(Startup startup, VCProfile vc) {
  double score = 0;

  // Industry match (40%)
  if (hasOverlap(startup.industry, vc.industry_preferences)) {
    score += 40;
  }

  // Stage match (30%)
  if (vc.stage_preferences.contains(startup.stage)) {
    score += 30;
  }

  // Geography match (20%)
  if (hasOverlap(startup.location, vc.geography_preferences)) {
    score += 20;
  }

  // Readiness score (10%)
  if (startup.readiness_score >= 3.5) {
    score += 10;
  }

  return score;
}
```

---

## Security Considerations

### 1. Role Assignment Security

**Problem:** Users could potentially manipulate their role field.

**Solutions:**
- ✅ Database trigger prevents role self-assignment
- ✅ Backend validates role on all profile updates
- ✅ Supabase RLS policies enforce role-based data access
- ✅ Frontend validation is UI-only (not trusted)

**Implementation:**

```sql
-- Database trigger to prevent role change
CREATE OR REPLACE FUNCTION prevent_role_self_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Only super_admins can change roles
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'You cannot change your own role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER prevent_role_self_change_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_role_self_change();
```

---

### 2. Data Isolation

**Problem:** VCs should not see unmatched startups or other VCs' data.

**Solutions:**
- ✅ Supabase RLS policies enforce row-level access
- ✅ Backend validates permissions before returning data
- ✅ API endpoints check role before querying database

**Example RLS Policy:**
```sql
-- VCs can only see startups they're matched with
CREATE POLICY "VCs can view matched startups only"
ON startups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vc_startup_matches
    WHERE vc_startup_matches.vc_id = auth.uid()
      AND vc_startup_matches.startup_id = startups.id
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);
```

---

### 3. Intro Request Validation

**Problem:** Prevent spam intro requests.

**Solutions:**
- ✅ Rate limiting: Max 5 intro requests per day per VC
- ✅ Unique constraint: One request per VC-Startup pair
- ✅ Admin review before approval
- ✅ Audit log for all requests

---

### 4. VC Application Fraud Prevention

**Problem:** Fake VC applications.

**Solutions:**
- ✅ Email verification required
- ✅ LinkedIn URL validation (check profile exists)
- ✅ Website URL validation (check domain authority)
- ✅ Manual admin review before approval
- ✅ Captcha on application form

---

### 5. Supabase RLS Policies

**All tables must have RLS enabled:**

```sql
-- Enable RLS on all new tables
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE vc_startup_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE intro_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vc_applications ENABLE ROW LEVEL SECURITY;
```

**Policy Patterns:**

```sql
-- Users can view/edit own data
CREATE POLICY "policy_name" ON table_name
FOR ALL USING (user_id = auth.uid());

-- Admins can view all
CREATE POLICY "policy_name" ON table_name
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Role-specific read access
CREATE POLICY "policy_name" ON table_name
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'vc'
  )
);
```

---

### 6. Frontend Security

**Best Practices:**
- ✅ Never trust client-side role checks for security
- ✅ Use ProtectedRoute for UI/UX, not security
- ✅ Backend must validate all permissions
- ✅ Sensitive data (admin notes, rejection reasons) never sent to frontend unless admin
- ✅ API keys in .env, never committed

---

## Migration Plan

### Phase 1: Database & Backend (Week 1)
1. ✅ Add role enum and VC fields to profiles table
2. ✅ Create startups, vc_startup_matches, intro_requests, vc_applications tables
3. ✅ Set up RLS policies
4. ✅ Create database triggers (prevent role self-change)
5. ✅ Update backend API with new endpoints
6. ✅ Add role-based authorization (@PreAuthorize)
7. ✅ Write matching algorithm service

---

### Phase 2: Frontend Auth & Routing (Week 2)
1. ✅ Create UserRole enum and types
2. ✅ Update UserContext with role helpers
3. ✅ Create ProtectedRoute component
4. ✅ Update App.tsx with role-based routes
5. ✅ Update AuthPage to set default role='founder'
6. ✅ Test route protection

---

### Phase 3: Layouts & Navigation (Week 2)
1. ✅ Create VCLayout (minimal navbar/footer)
2. ✅ Create AdminLayout (sidebar + header)
3. ✅ Update MainLayout to hide VC/Admin links
4. ✅ Add role badges to profile pages

---

### Phase 4: VC Portal Pages (Week 3)
1. ✅ VCOnboarding (preferences form)
2. ✅ VCDashboard (matched startups feed)
3. ✅ VCStartupDetail (startup detail view)
4. ✅ VCIntros (intro pipeline)
5. ✅ VCSaved (saved startups)
6. ✅ VCProfile (settings)
7. ✅ VCPending (pending approval page)

---

### Phase 5: Admin Portal Pages (Week 4)
1. ✅ AdminDashboard (overview)
2. ✅ AdminUsers (user management)
3. ✅ AdminStartups (startup approval queue)
4. ✅ AdminVCs (VC approval queue)
5. ✅ AdminMatching (algorithm config)
6. ✅ AdminIntros (intro management)
7. ✅ AdminAnalytics (platform metrics)

---

### Phase 6: Founder Experience Updates (Week 5)
1. ✅ Update VCConnectionPage (request intro flow)
2. ✅ Add startup submission workflow
3. ✅ Add intro request status tracking
4. ✅ Update dashboard with VC connection status

---

### Phase 7: Testing & Polish (Week 6)
1. ✅ End-to-end testing (all user flows)
2. ✅ Security audit (role permissions)
3. ✅ UI polish (empty states, loading states)
4. ✅ Documentation
5. ✅ Deploy to staging
6. ✅ User acceptance testing

---

### Phase 8: Launch (Week 7)
1. ✅ Manually create first super_admin account
2. ✅ Deploy to production
3. ✅ Invite beta VCs
4. ✅ Monitor & iterate

---

## Component File Structure

```
src/
├── types/
│   ├── roles.ts                    # UserRole enum, permissions
│   └── vc.ts                       # VC-specific types
│
├── contexts/
│   └── UserContext.tsx             # Updated with role helpers
│
├── components/
│   ├── ProtectedRoute.tsx          # Route guard component
│   │
│   ├── vc/
│   │   ├── VCNavbar.tsx
│   │   ├── VCFooter.tsx
│   │   ├── StartupCard.tsx
│   │   ├── IntroRequestModal.tsx
│   │   └── MatchBadge.tsx
│   │
│   └── admin/
│       ├── AdminSidebar.tsx
│       ├── AdminHeader.tsx
│       ├── UserTable.tsx
│       ├── StartupApprovalCard.tsx
│       ├── VCApplicationCard.tsx
│       └── IntroRequestCard.tsx
│
├── layouts/
│   ├── MainLayout.tsx              # Existing (for founders)
│   ├── VCLayout.tsx                # New (VC portal)
│   └── AdminLayout.tsx             # New (admin dashboard)
│
└── components/pages/
    ├── vc/
    │   ├── VCDashboard.tsx
    │   ├── VCOnboarding.tsx
    │   ├── VCStartups.tsx
    │   ├── VCStartupDetail.tsx
    │   ├── VCIntros.tsx
    │   ├── VCSaved.tsx
    │   ├── VCProfile.tsx
    │   └── VCPending.tsx
    │
    └── admin/
        ├── AdminDashboard.tsx
        ├── AdminUsers.tsx
        ├── AdminStartups.tsx
        ├── AdminVCs.tsx
        ├── AdminMatching.tsx
        ├── AdminIntros.tsx
        └── AdminAnalytics.tsx
```

---

## Key Success Metrics

### For Founders:
- ✅ Clear path to VC connection
- ✅ Transparency in intro request status
- ✅ No VC browsing (curated matching only)

### For VCs:
- ✅ High signal-to-noise ratio
- ✅ Only see qualified, matched startups
- ✅ Professional, minimal interface
- ✅ No community clutter

### For Motif (Admins):
- ✅ Full control over matching
- ✅ Intro request approval workflow
- ✅ VC quality control
- ✅ Platform health monitoring

---

## Next Steps

1. **Review & approve this architecture**
2. **Prioritize features for MVP** (can skip some admin features initially)
3. **Start with database migration** (Phase 1)
4. **Build ProtectedRoute & update routing** (Phase 2)
5. **Implement VC portal first** (highest value)
6. **Admin dashboard second** (control layer)
7. **Update founder experience last** (enhancement)

---

## Questions to Resolve

1. **VC Approval Process:**
   - Should VCs be auto-approved or manual review?
   - **Recommendation:** Manual review for quality control

2. **Startup Approval:**
   - What criteria for "VC-ready"?
   - **Recommendation:** Readiness score ≥ 3.5/5 + admin review

3. **Intro Request Workflow:**
   - Should all intro requests require admin approval?
   - **Recommendation:** Yes, to maintain quality and prevent spam

4. **Pricing:**
   - Should VCs pay to access platform?
   - **Recommendation:** Free for VCs (founders pay for premium features)

5. **Matching Frequency:**
   - How often to run matching algorithm?
   - **Recommendation:** Daily at 2 AM (off-peak hours)

6. **Data Sharing:**
   - What data can VCs see before intro approval?
   - **Recommendation:** Full profile except direct contact info

---

**End of Architecture Document**
