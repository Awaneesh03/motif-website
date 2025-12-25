# Motif Three-Role System - Implementation Checklist

**Quick Reference Guide for Development Team**

---

## Overview

This checklist breaks down the complete three-role authentication system into actionable tasks. Check off items as you complete them.

**Three Roles:**
- 🔴 **Super Admin** - Internal team, full control
- 🔵 **Founder** - Startup creators (default role)
- 🟢 **VC/Investor** - Curated deal flow access

---

## Phase 1: Database & Backend Setup

### Database Migrations

#### ✅ Update Profiles Table
```sql
-- File: migrations/001_add_role_system.sql

- [ ] Modify `role` column to support new values
- [ ] Add check constraint for valid roles
- [ ] Set default role to 'founder'
- [ ] Add VC-specific columns:
  - [ ] firm_name
  - [ ] vc_role
  - [ ] bio
  - [ ] investment_thesis
  - [ ] stage_preferences (JSONB)
  - [ ] industry_preferences (JSONB)
  - [ ] geography_preferences (JSONB)
  - [ ] cheque_size_min
  - [ ] cheque_size_max
  - [ ] approved_at
  - [ ] approved_by
```

#### ✅ Create Startups Table
```sql
-- File: migrations/002_create_startups_table.sql

- [ ] Create table with all fields (see architecture doc)
- [ ] Add indexes (founder_id, status, stage, industry)
- [ ] Enable RLS
- [ ] Create policies:
  - [ ] Founders can manage own startups
  - [ ] VCs can view approved startups only
  - [ ] Admins can view all
```

#### ✅ Create VC Startup Matches Table
```sql
-- File: migrations/003_create_vc_matches_table.sql

- [ ] Create table (vc_id, startup_id, match_score, etc.)
- [ ] Add unique constraint (vc_id, startup_id)
- [ ] Add indexes
- [ ] Enable RLS
- [ ] Create policies
```

#### ✅ Create Intro Requests Table
```sql
-- File: migrations/004_create_intro_requests_table.sql

- [ ] Create table with status workflow
- [ ] Add indexes
- [ ] Enable RLS
- [ ] Create policies (VCs see own, founders see theirs, admins see all)
```

#### ✅ Create VC Applications Table
```sql
-- File: migrations/005_create_vc_applications_table.sql

- [ ] Create table for VC application form
- [ ] Add indexes
- [ ] Enable RLS
- [ ] Create policies
```

#### ✅ Security Triggers
```sql
-- File: migrations/006_security_triggers.sql

- [ ] Create prevent_role_self_change() trigger
- [ ] Test: Non-admin cannot change own role
- [ ] Test: Admin can change others' roles
```

---

### Backend API Updates (Java Spring Boot)

#### ✅ Security Configuration
```java
// File: SecurityConfig.java

- [ ] Add role-based authorization rules
- [ ] Configure endpoint permissions
- [ ] Test JWT role extraction
```

#### ✅ User Controller
```java
// File: UserController.java

- [ ] GET /api/users/me - Get current user with role
- [ ] PUT /api/users/me - Update profile (block role change)
- [ ] POST /api/users/me/onboarding - Complete onboarding
```

#### ✅ Admin Controller
```java
// File: AdminController.java

- [ ] GET /api/admin/stats - Platform overview stats
- [ ] GET /api/admin/users - List users with filters
- [ ] PUT /api/admin/users/{id}/role - Change user role
- [ ] GET /api/admin/startups/pending - Pending approvals
- [ ] POST /api/admin/startups/{id}/approve - Approve startup
- [ ] POST /api/admin/startups/{id}/reject - Reject startup
- [ ] GET /api/admin/vc-applications - List VC applications
- [ ] POST /api/admin/vc-applications/{id}/approve - Approve VC
- [ ] POST /api/admin/vc-applications/{id}/reject - Reject VC
- [ ] GET /api/admin/intros - List intro requests
- [ ] POST /api/admin/intros/{id}/approve - Approve intro
- [ ] POST /api/admin/intros/{id}/reject - Reject intro
```

#### ✅ Startup Controller
```java
// File: StartupController.java

- [ ] POST /api/startups - Create startup
- [ ] PUT /api/startups/{id} - Update own startup
- [ ] GET /api/startups/mine - Get my startups
- [ ] POST /api/startups/{id}/submit-for-review - Submit for approval
- [ ] DELETE /api/startups/{id} - Delete own startup
```

#### ✅ VC Controller
```java
// File: VCController.java

- [ ] GET /api/vc/matches - Get matched startups
- [ ] GET /api/vc/startups/{id} - Get startup detail (validate access)
- [ ] POST /api/vc/startups/{id}/save - Save for later
- [ ] POST /api/vc/startups/{id}/pass - Pass on startup
- [ ] POST /api/vc/startups/{id}/request-intro - Request intro
- [ ] GET /api/vc/intros - Get my intro requests
- [ ] PUT /api/vc/preferences - Update investment preferences
- [ ] POST /api/vc/startups/{id}/note - Save private note
- [ ] GET /api/vc/saved - Get saved startups
```

#### ✅ Matching Service
```java
// File: MatchingService.java

- [ ] Implement calculateMatchScore() algorithm
- [ ] Implement runMatchingAlgorithm() scheduled job
- [ ] Add matching criteria weights configuration
- [ ] Create vc_startup_matches records
- [ ] Send notifications for new matches
- [ ] Test matching accuracy
```

#### ✅ Email Service
```java
// File: EmailService.java

- [ ] VC application confirmation email
- [ ] VC approval email
- [ ] Intro request notification (to admin)
- [ ] Intro approved email (to both parties)
- [ ] New match notification (to VC)
```

---

## Phase 2: Frontend Auth & Routing

### Type Definitions

#### ✅ Role Types
```typescript
// File: src/types/roles.ts

- [ ] Create UserRole enum (super_admin, founder, vc, vc_pending)
- [ ] Extend UserProfile interface with VC fields
- [ ] Create hasAccess() helper function
- [ ] Create RoutePermission interface
- [ ] Export all types
```

#### ✅ VC Types
```typescript
// File: src/types/vc.ts

- [ ] Create Startup interface
- [ ] Create StartupMatch interface
- [ ] Create IntroRequest interface
- [ ] Create VCPreferences interface
- [ ] Export all types
```

---

### Core Components

#### ✅ Protected Route Component
```typescript
// File: src/components/ProtectedRoute.tsx

- [ ] Create ProtectedRoute component
- [ ] Implement loading state
- [ ] Check authentication
- [ ] Check role access
- [ ] Show toast on access denied
- [ ] Redirect to appropriate dashboard
- [ ] Test all redirect scenarios
```

#### ✅ User Context Updates
```typescript
// File: src/contexts/UserContext.tsx

- [ ] Add isFounder helper
- [ ] Add isVC helper
- [ ] Add isAdmin helper
- [ ] Add hasRole() function
- [ ] Update UserContextType interface
- [ ] Update profile loading to fetch role
- [ ] Handle role-based redirect after login
```

---

### Routing

#### ✅ App.tsx Router Updates
```typescript
// File: src/App.tsx

- [ ] Import ProtectedRoute
- [ ] Import UserRole enum
- [ ] Import new layouts (VCLayout, AdminLayout)
- [ ] Wrap founder routes with ProtectedRoute (FOUNDER, SUPER_ADMIN)
- [ ] Create VC routes with ProtectedRoute (VC, SUPER_ADMIN)
- [ ] Create Admin routes with ProtectedRoute (SUPER_ADMIN only)
- [ ] Test each route protection
- [ ] Test redirect behavior
```

**Route Checklist:**
- [ ] Founder routes protected: /dashboard, /profile, /idea-analyser, /pitch-creator, /community, /resources, /get-funded, /saved-ideas, /membership
- [ ] VC routes created: /vc/dashboard, /vc/onboarding, /vc/startups, /vc/startups/:id, /vc/intros, /vc/saved, /vc/profile, /vc/pending
- [ ] Admin routes created: /admin/dashboard, /admin/users, /admin/startups, /admin/vcs, /admin/matching, /admin/intros, /admin/analytics
- [ ] Catch-all route redirects to home

---

## Phase 3: Layouts & Navigation

### Layouts

#### ✅ VC Layout
```typescript
// File: src/layouts/VCLayout.tsx

- [ ] Create VCLayout component
- [ ] Add VCNavbar
- [ ] Add VCFooter
- [ ] Use clean, minimal design
- [ ] No chatbot
- [ ] No theme toggle (use light theme)
- [ ] Render <Outlet />
```

#### ✅ Admin Layout
```typescript
// File: src/layouts/AdminLayout.tsx

- [ ] Create AdminLayout component
- [ ] Add AdminSidebar (dark theme)
- [ ] Add AdminHeader
- [ ] Add pending badges on sidebar items
- [ ] Render <Outlet />
```

---

### Navigation Components

#### ✅ VC Navbar
```typescript
// File: src/components/vc/VCNavbar.tsx

- [ ] Motif logo (links to /vc/dashboard)
- [ ] Links: Dashboard, Startups, Intros
- [ ] Right side: Profile dropdown
- [ ] Dropdown options: Settings, Logout
- [ ] Minimal, professional design
```

#### ✅ VC Footer
```typescript
// File: src/components/vc/VCFooter.tsx

- [ ] Minimal footer
- [ ] Links: Terms, Privacy, Contact
- [ ] No marketing content
```

#### ✅ Admin Sidebar
```typescript
// File: src/components/admin/AdminSidebar.tsx

- [ ] Dark theme
- [ ] Navigation links with icons:
  - [ ] Dashboard
  - [ ] Users
  - [ ] Startups (with pending badge)
  - [ ] VCs (with pending badge)
  - [ ] Matching
  - [ ] Intros (with pending badge)
  - [ ] Analytics
- [ ] Active state highlighting
- [ ] Fetch pending counts from API
```

#### ✅ Admin Header
```typescript
// File: src/components/admin/AdminHeader.tsx

- [ ] Show current page title
- [ ] Right side: Admin profile + logout
- [ ] Notification bell (optional)
```

---

### Update Main Layout

#### ✅ MainLayout (Founder Layout)
```typescript
// File: src/layouts/MainLayout.tsx

- [ ] Update Navbar to hide VC/Admin links from founders
- [ ] Show role badge on profile (optional)
- [ ] Keep existing chatbot and footer
```

---

## Phase 4: VC Portal Pages

### VC Dashboard

#### ✅ VC Dashboard Page
```typescript
// File: src/components/pages/vc/VCDashboard.tsx

- [ ] Hero stats row (New Matches, Pending Intros, Saved)
- [ ] Fetch matched startups from API
- [ ] Render StartupCard for each match
- [ ] Left sidebar filters (Stage, Industry, Geography, Score)
- [ ] Implement filter logic
- [ ] Sort options (Newest, Highest Score, Best Match)
- [ ] Empty state
- [ ] Loading state
- [ ] Error handling
```

#### ✅ Startup Card Component
```typescript
// File: src/components/vc/StartupCard.tsx

- [ ] Display startup name, tagline
- [ ] Show stage, location, ask amount
- [ ] Show industry tags
- [ ] Readiness score visualization (stars)
- [ ] "Why this matches" text
- [ ] Save button (toggle)
- [ ] Request Intro button
- [ ] View Full Profile link
- [ ] Hover effects
```

---

### VC Onboarding

#### ✅ VC Onboarding Page
```typescript
// File: src/components/pages/vc/VCOnboarding.tsx

- [ ] Multi-step form:
  - [ ] Step 1: Investment Preferences
    - [ ] Industry focus (multi-select checkboxes)
    - [ ] Stage preference (radio buttons)
    - [ ] Cheque size (number inputs)
    - [ ] Geography (multi-select)
    - [ ] Investment thesis (textarea)
  - [ ] Step 2: Profile Details
    - [ ] Firm name
    - [ ] Your role
    - [ ] Bio
    - [ ] LinkedIn URL
    - [ ] Website URL
  - [ ] Step 3: Review & Submit
- [ ] Form validation
- [ ] Save to API
- [ ] Redirect to /vc/dashboard on complete
- [ ] Check if already onboarded (redirect if yes)
```

---

### VC Startup Detail

#### ✅ VC Startup Detail Page
```typescript
// File: src/components/pages/vc/VCStartupDetail.tsx

- [ ] Fetch startup by ID from API
- [ ] Validate VC has access (show 403 if not)
- [ ] Two-column layout:
  - [ ] Left: Main content
    - [ ] Startup overview
    - [ ] Founder info
    - [ ] Problem statement
    - [ ] Solution
    - [ ] Market opportunity
    - [ ] Business model
    - [ ] Traction signals
    - [ ] Pitch deck viewer/download
    - [ ] Motif evaluation summary
  - [ ] Right: Sticky sidebar
    - [ ] Action buttons (Save, Request Intro, Pass)
    - [ ] Private notes textarea
    - [ ] Match score breakdown
- [ ] Request Intro modal
- [ ] Loading state
- [ ] Error handling
```

#### ✅ Intro Request Modal
```typescript
// File: src/components/vc/IntroRequestModal.tsx

- [ ] Modal component (using Radix Dialog)
- [ ] Form fields:
  - [ ] Message to founder (optional, 500 char limit)
  - [ ] Value you can add (required, for admin)
  - [ ] Confirmation checkbox
- [ ] Submit to API
- [ ] Show success toast
- [ ] Close modal
- [ ] Disable button if already requested
```

---

### VC Intros

#### ✅ VC Intros Page
```typescript
// File: src/components/pages/vc/VCIntros.tsx

- [ ] Tabs: Pending, Approved, Meetings, Archive
- [ ] Fetch intro requests from API
- [ ] Render IntroRequestCard for each
- [ ] Filter by status
- [ ] Empty state for each tab
- [ ] Loading state
```

#### ✅ Intro Request Card Component
```typescript
// File: src/components/vc/IntroRequestCard.tsx

- [ ] Display startup name & tagline
- [ ] Show status badge
- [ ] Show date (requested, approved, meeting date)
- [ ] Show admin response if any
- [ ] Action buttons based on status:
  - [ ] View Details
  - [ ] Add to Calendar (if meeting scheduled)
- [ ] Status-specific UI
```

---

### VC Saved & Profile

#### ✅ VC Saved Page
```typescript
// File: src/components/pages/vc/VCSaved.tsx

- [ ] Fetch saved startups from API
- [ ] Render StartupCard for each
- [ ] Unsave button
- [ ] Sort options
- [ ] Empty state
```

#### ✅ VC Profile Page
```typescript
// File: src/components/pages/vc/VCProfile.tsx

- [ ] Tabs: Profile, Preferences, Notifications, Account
- [ ] Profile Tab: Edit name, bio, firm, avatar, LinkedIn
- [ ] Preferences Tab: Edit investment preferences
- [ ] Notifications Tab: Email preferences
- [ ] Account Tab: Change password, logout, delete account
- [ ] Form validation
- [ ] Save to API
```

#### ✅ VC Pending Page
```typescript
// File: src/components/pages/vc/VCPending.tsx

- [ ] Show "Application Under Review" message
- [ ] Show submitted application details
- [ ] Show estimated review time
- [ ] Logout button
```

---

## Phase 5: Admin Portal Pages

### Admin Dashboard

#### ✅ Admin Dashboard Page
```typescript
// File: src/components/pages/admin/AdminDashboard.tsx

- [ ] Fetch stats from API
- [ ] Key metrics cards:
  - [ ] Total users (breakdown)
  - [ ] Active startups
  - [ ] Pending VC applications
  - [ ] Pending startup approvals
  - [ ] Intro requests (this week)
  - [ ] Platform health score
- [ ] Charts:
  - [ ] User growth (line chart)
  - [ ] Idea analysis volume (bar chart)
  - [ ] VC matching success rate (pie chart)
- [ ] Recent activity feed
- [ ] Refresh button
```

---

### Admin Users

#### ✅ Admin Users Page
```typescript
// File: src/components/pages/admin/AdminUsers.tsx

- [ ] Fetch users from API with pagination
- [ ] User table columns: Name, Email, Role, Status, Joined, Actions
- [ ] Filters: Role, Status, Date range
- [ ] Search by name/email
- [ ] Actions per row:
  - [ ] View profile modal
  - [ ] Change role dropdown
  - [ ] Suspend/Unsuspend button
  - [ ] Send notification button
  - [ ] View activity log
- [ ] Pagination
- [ ] Loading state
```

#### ✅ User Table Component
```typescript
// File: src/components/admin/UserTable.tsx

- [ ] Reusable table component
- [ ] Sortable columns
- [ ] Role badge styling
- [ ] Status indicator (active/suspended)
- [ ] Actions dropdown menu
- [ ] Confirm dialogs for destructive actions
```

---

### Admin Startups

#### ✅ Admin Startups Page
```typescript
// File: src/components/pages/admin/AdminStartups.tsx

- [ ] Tabs: Pending Approval, Approved, Rejected
- [ ] Fetch startups by status from API
- [ ] Render StartupApprovalCard for each
- [ ] Filters: Stage, Industry, Readiness Score
- [ ] Sort by: Date submitted, Readiness score
- [ ] Empty states
```

#### ✅ Startup Approval Card Component
```typescript
// File: src/components/admin/StartupApprovalCard.tsx

- [ ] Display startup info (name, founder, stage, industry)
- [ ] Show readiness score
- [ ] Show submission date
- [ ] View Details button (opens modal)
- [ ] Approve/Reject buttons (if pending)
- [ ] Modal shows:
  - [ ] Full startup profile
  - [ ] Pitch deck preview
  - [ ] Validation scores breakdown
  - [ ] Admin notes textarea
  - [ ] Approve/Reject buttons
- [ ] Confirmation dialogs
```

---

### Admin VCs

#### ✅ Admin VCs Page
```typescript
// File: src/components/pages/admin/AdminVCs.tsx

- [ ] Tabs: Pending Applications, Approved VCs, Rejected
- [ ] Fetch VC applications/profiles from API
- [ ] Render VCApplicationCard for each
- [ ] Filters: Applied date, Industry focus
- [ ] Search by name/firm
```

#### ✅ VC Application Card Component
```typescript
// File: src/components/admin/VCApplicationCard.tsx

- [ ] Display VC name, firm, email
- [ ] Show application date
- [ ] Review button (opens modal)
- [ ] Modal shows:
  - [ ] Full application details
  - [ ] Bio, thesis, preferences
  - [ ] LinkedIn verification link
  - [ ] Admin notes textarea
  - [ ] Approve/Reject/Request More Info buttons
- [ ] Send approval email on approve
- [ ] Create profile with role='vc'
```

---

### Admin Matching

#### ✅ Admin Matching Page
```typescript
// File: src/components/pages/admin/AdminMatching.tsx

- [ ] Algorithm configuration section:
  - [ ] Industry match weight slider
  - [ ] Stage match weight slider
  - [ ] Geography match weight slider
  - [ ] Readiness score threshold slider
- [ ] Save configuration to database
- [ ] Test matching section:
  - [ ] Select startup (dropdown)
  - [ ] Select VC (dropdown)
  - [ ] Calculate match button
  - [ ] Show match score and breakdown
- [ ] Manual override section:
  - [ ] Create startup-VC pairing
  - [ ] Override reason textarea
  - [ ] Submit button
- [ ] Recent matches table
```

---

### Admin Intros

#### ✅ Admin Intros Page
```typescript
// File: src/components/pages/admin/AdminIntros.tsx

- [ ] Tabs: Pending Review, Approved, Rejected, Completed
- [ ] Fetch intro requests by status from API
- [ ] Render IntroRequestCard for each
- [ ] Filters: Date range, Startup, VC
- [ ] Sort by: Date requested
- [ ] Empty states
```

#### ✅ Admin Intro Request Card Component
```typescript
// File: src/components/admin/IntroRequestCard.tsx

- [ ] Display startup name, VC name
- [ ] Show status badge
- [ ] Show request date
- [ ] View Details button (opens modal)
- [ ] Modal shows:
  - [ ] Startup summary
  - [ ] VC profile summary
  - [ ] VC message & value-add
  - [ ] Match score
  - [ ] Admin notes textarea
  - [ ] Approve/Reject buttons
- [ ] Send intro email on approve
- [ ] Update status in database
```

---

### Admin Analytics

#### ✅ Admin Analytics Page
```typescript
// File: src/components/pages/admin/AdminAnalytics.tsx

- [ ] Date range selector
- [ ] Reports:
  - [ ] User engagement (DAU/MAU chart)
  - [ ] Idea analysis completion rate
  - [ ] Pitch deck creation rate
  - [ ] VC matching accuracy
  - [ ] Intro-to-meeting conversion rate
  - [ ] Revenue metrics (if applicable)
- [ ] Export CSV button
- [ ] Refresh button
- [ ] Loading state
```

---

## Phase 6: Founder Experience Updates

### VC Connection Page

#### ✅ Update VCConnectionPage
```typescript
// File: src/components/pages/VCConnectionPage.tsx

- [ ] Update messaging: "Request intro via Motif (no browsing)"
- [ ] Request intro form:
  - [ ] Select your startup (if multiple)
  - [ ] Startup summary (if not already filled)
  - [ ] Stage
  - [ ] Ask amount
  - [ ] Upload pitch deck
  - [ ] Submit button
- [ ] Submit to API (creates startup if needed, marks for review)
- [ ] Show status tracker:
  - [ ] Submitted
  - [ ] Under Review
  - [ ] Approved for VCs
  - [ ] Matched with VCs
  - [ ] Intro Requested by VC
  - [ ] Intro Approved
  - [ ] Meeting Scheduled
- [ ] Fetch current status from API
- [ ] Disable form if already submitted
```

---

### Dashboard Updates

#### ✅ Update DashboardPage
```typescript
// File: src/components/pages/DashboardPage.tsx

- [ ] Add VC connection status card
- [ ] Show intro request count
- [ ] Show meeting status
- [ ] Link to VCConnectionPage
```

---

## Phase 7: Testing & Polish

### Unit Tests

- [ ] Test ProtectedRoute with all roles
- [ ] Test UserContext role helpers
- [ ] Test hasAccess() function
- [ ] Test route redirects
- [ ] Test form validations
- [ ] Test API error handling

### Integration Tests

- [ ] Test founder flow: Signup → Onboarding → Idea Analyzer → Request VC intro
- [ ] Test VC flow: Apply → Approval → Onboarding → View startups → Request intro
- [ ] Test admin flow: Approve VC → Approve startup → Review intro → Approve intro
- [ ] Test role changes (admin changing user roles)
- [ ] Test unauthorized access attempts

### Security Audit

- [ ] Verify all RLS policies work correctly
- [ ] Test: Founder cannot access VC routes
- [ ] Test: VC cannot access founder tools
- [ ] Test: VC cannot see unmatched startups
- [ ] Test: Non-admin cannot change own role
- [ ] Test: Non-admin cannot access admin routes
- [ ] Test: API returns 403 for unauthorized requests
- [ ] Test: No sensitive data leaked in API responses
- [ ] Test: Intro requests are rate-limited
- [ ] Test: VC applications require verification

### UI/UX Polish

- [ ] Add empty states for all lists/tables
- [ ] Add loading skeletons for all data fetching
- [ ] Add error states with retry buttons
- [ ] Add success/error toast notifications
- [ ] Add confirmation dialogs for destructive actions
- [ ] Add keyboard shortcuts (optional)
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test dark mode (if applicable to admin panel)
- [ ] Add animations/transitions (subtle)
- [ ] Accessibility audit (ARIA labels, keyboard nav, screen reader)

### Performance Optimization

- [ ] Implement pagination for all tables/lists
- [ ] Add debouncing to search inputs
- [ ] Add caching for frequently fetched data
- [ ] Optimize image loading (lazy load, compress)
- [ ] Code splitting for role-specific pages
- [ ] Analyze bundle size
- [ ] Add loading state for slow API calls

---

## Phase 8: Deployment & Launch

### Pre-Deployment

- [ ] Environment variables configured:
  - [ ] VITE_SUPABASE_URL
  - [ ] VITE_SUPABASE_ANON_KEY
  - [ ] VITE_BACKEND_URL
  - [ ] Email service credentials
- [ ] Database migrations run on production
- [ ] Backend deployed with role-based auth
- [ ] Frontend built and deployed
- [ ] HTTPS configured
- [ ] CDN configured (if applicable)

### Initial Setup

- [ ] Manually create first super_admin account:
  ```sql
  UPDATE profiles
  SET role = 'super_admin'
  WHERE email = 'admin@motif.com';
  ```
- [ ] Test admin login
- [ ] Test admin dashboard access
- [ ] Verify all admin functions work

### Launch

- [ ] Deploy to production
- [ ] Smoke test all critical flows
- [ ] Invite 3-5 beta VCs
- [ ] Invite 10-20 beta founders
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Iterate based on feedback

---

## Monitoring & Maintenance

### Ongoing Tasks

- [ ] Monitor user signups (role distribution)
- [ ] Monitor VC application approval rate
- [ ] Monitor startup approval rate
- [ ] Monitor intro request success rate
- [ ] Monitor matching algorithm accuracy
- [ ] Review admin activity logs
- [ ] Handle user support requests
- [ ] Fix bugs as reported
- [ ] Iterate on matching algorithm weights

---

## Quick Reference: File Paths

### New Files to Create

**Types:**
- `src/types/roles.ts`
- `src/types/vc.ts`

**Components:**
- `src/components/ProtectedRoute.tsx`
- `src/components/vc/VCNavbar.tsx`
- `src/components/vc/VCFooter.tsx`
- `src/components/vc/StartupCard.tsx`
- `src/components/vc/IntroRequestModal.tsx`
- `src/components/vc/MatchBadge.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/AdminHeader.tsx`
- `src/components/admin/UserTable.tsx`
- `src/components/admin/StartupApprovalCard.tsx`
- `src/components/admin/VCApplicationCard.tsx`
- `src/components/admin/IntroRequestCard.tsx`

**Layouts:**
- `src/layouts/VCLayout.tsx`
- `src/layouts/AdminLayout.tsx`

**VC Pages:**
- `src/components/pages/vc/VCDashboard.tsx`
- `src/components/pages/vc/VCOnboarding.tsx`
- `src/components/pages/vc/VCStartups.tsx`
- `src/components/pages/vc/VCStartupDetail.tsx`
- `src/components/pages/vc/VCIntros.tsx`
- `src/components/pages/vc/VCSaved.tsx`
- `src/components/pages/vc/VCProfile.tsx`
- `src/components/pages/vc/VCPending.tsx`

**Admin Pages:**
- `src/components/pages/admin/AdminDashboard.tsx`
- `src/components/pages/admin/AdminUsers.tsx`
- `src/components/pages/admin/AdminStartups.tsx`
- `src/components/pages/admin/AdminVCs.tsx`
- `src/components/pages/admin/AdminMatching.tsx`
- `src/components/pages/admin/AdminIntros.tsx`
- `src/components/pages/admin/AdminAnalytics.tsx`

**Database Migrations:**
- `migrations/001_add_role_system.sql`
- `migrations/002_create_startups_table.sql`
- `migrations/003_create_vc_matches_table.sql`
- `migrations/004_create_intro_requests_table.sql`
- `migrations/005_create_vc_applications_table.sql`
- `migrations/006_security_triggers.sql`

### Files to Modify

- `src/contexts/UserContext.tsx` - Add role helpers
- `src/App.tsx` - Add role-based routes
- `src/layouts/MainLayout.tsx` - Update navbar for role visibility
- `src/components/pages/VCConnectionPage.tsx` - Update to request intro flow
- `src/components/pages/DashboardPage.tsx` - Add VC connection status
- `src/components/Navbar.tsx` - Add role-based link visibility

---

## Success Criteria

### Founder Experience
✅ Founders can sign up and default to 'founder' role
✅ Founders can access all founder tools
✅ Founders cannot access VC or admin routes
✅ Founders can request VC intros via curated flow
✅ Founders can track intro status

### VC Experience
✅ VCs can apply via application form
✅ VCs await admin approval (vc_pending state)
✅ Approved VCs can complete onboarding
✅ VCs only see startups matched to their preferences
✅ VCs can request intros (subject to admin approval)
✅ VCs have professional, minimal interface
✅ VCs cannot access founder tools or community

### Admin Experience
✅ Admins have full platform visibility
✅ Admins can approve/reject VCs
✅ Admins can approve/reject startups
✅ Admins can approve/reject intro requests
✅ Admins can change user roles
✅ Admins can configure matching algorithm
✅ Admins can view platform analytics

### Security
✅ All roles enforced at database level (RLS)
✅ All roles enforced at API level (Spring Security)
✅ All roles enforced at UI level (ProtectedRoute)
✅ No user can self-assign roles
✅ No data leakage across roles
✅ All destructive actions require confirmation

---

**End of Implementation Checklist**
