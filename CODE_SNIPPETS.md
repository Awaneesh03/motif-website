# Motif Three-Role System - Code Snippets

**Quick copy-paste reference for key implementations**

---

## 1. Types & Constants

### `src/types/roles.ts`

```typescript
// Role enum
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  FOUNDER = 'founder',
  VC = 'vc',
  VC_PENDING = 'vc_pending',
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
  vc_role?: string;
  bio?: string;
  investment_thesis?: string;
  stage_preferences?: string[];
  industry_preferences?: string[];
  geography_preferences?: string[];
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

// Get default route for role
export const getRoleDefaultRoute = (role: UserRole): string => {
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

// Route permission config
export interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
  redirectOnFail: string;
}

// Route permissions map
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Founder routes
  {
    path: '/dashboard',
    allowedRoles: [UserRole.FOUNDER, UserRole.SUPER_ADMIN],
    redirectOnFail: '/auth',
  },
  {
    path: '/idea-analyser',
    allowedRoles: [UserRole.FOUNDER, UserRole.SUPER_ADMIN],
    redirectOnFail: '/dashboard',
  },
  {
    path: '/community',
    allowedRoles: [UserRole.FOUNDER, UserRole.SUPER_ADMIN],
    redirectOnFail: '/dashboard',
  },
  // VC routes
  {
    path: '/vc/dashboard',
    allowedRoles: [UserRole.VC, UserRole.SUPER_ADMIN],
    redirectOnFail: '/auth',
  },
  // Admin routes
  {
    path: '/admin/dashboard',
    allowedRoles: [UserRole.SUPER_ADMIN],
    redirectOnFail: '/',
  },
];
```

---

## 2. Protected Route Component

### `src/components/ProtectedRoute.tsx`

```typescript
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { UserRole, hasAccess, getRoleDefaultRoute } from '@/types/roles';
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

    // Redirect based on user role or custom redirect
    const fallbackRedirect = redirectTo || getRoleDefaultRoute(profile.role as UserRole);
    return <Navigate to={fallbackRedirect} replace />;
  }

  // Authorized
  return <>{children}</>;
};
```

---

## 3. User Context Updates

### `src/contexts/UserContext.tsx` (additions)

```typescript
import { UserRole } from '@/types/roles';

export interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;

  // New role helpers
  isFounder: boolean;
  isVC: boolean;
  isAdmin: boolean;
  hasRole: (role: UserRole) => boolean;
}

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ... existing code ...

  // Role helpers
  const isFounder = profile?.role === UserRole.FOUNDER;
  const isVC = profile?.role === UserRole.VC;
  const isAdmin = profile?.role === UserRole.SUPER_ADMIN;

  const hasRole = (role: UserRole) => profile?.role === role;

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
};
```

---

## 4. App Router with Role Protection

### `src/App.tsx` (role-based routes)

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserRole } from '@/types/roles';

// Layouts
import { MainLayout } from '@/layouts/MainLayout';
import { VCLayout } from '@/layouts/VCLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

// ... imports for pages ...

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/auth" element={<AuthPage />} />
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
            path="/idea-analyser"
            element={
              <ProtectedRoute allowedRoles={[UserRole.FOUNDER, UserRole.SUPER_ADMIN]}>
                <IdeaAnalyserPage />
              </ProtectedRoute>
            }
          />
          {/* ... other founder routes ... */}
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
            path="/vc/startups/:id"
            element={
              <ProtectedRoute allowedRoles={[UserRole.VC, UserRole.SUPER_ADMIN]}>
                <VCStartupDetail />
              </ProtectedRoute>
            }
          />
          {/* ... other VC routes ... */}
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
          {/* ... other admin routes ... */}
        </Route>

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## 5. VCLayout

### `src/layouts/VCLayout.tsx`

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

### `src/components/vc/VCNavbar.tsx`

```typescript
import { Link } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const VCNavbar = () => {
  const { profile } = useUser();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/vc/dashboard" className="text-2xl font-bold text-gray-900">
              Motif
            </Link>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-8">
            <Link
              to="/vc/dashboard"
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Dashboard
            </Link>
            <Link
              to="/vc/startups"
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Startups
            </Link>
            <Link
              to="/vc/intros"
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              Intros
            </Link>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-2">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/vc/profile" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};
```

---

## 6. AdminLayout

### `src/layouts/AdminLayout.tsx`

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

### `src/components/admin/AdminSidebar.tsx`

```typescript
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  GitMerge,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/startups', label: 'Startups', icon: Building2, badge: 'pending_startups' },
  { path: '/admin/vcs', label: 'VCs', icon: Briefcase, badge: 'pending_vcs' },
  { path: '/admin/matching', label: 'Matching', icon: GitMerge },
  { path: '/admin/intros', label: 'Intros', icon: MessageSquare, badge: 'pending_intros' },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
];

export const AdminSidebar = () => {
  const location = useLocation();
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    // Fetch pending counts
    const fetchBadges = async () => {
      try {
        const stats = await apiClient.get<any>('/api/admin/stats');
        setBadges({
          pending_startups: stats.pending_startups || 0,
          pending_vcs: stats.pending_vcs || 0,
          pending_intros: stats.pending_intros || 0,
        });
      } catch (error) {
        console.error('Failed to fetch admin badges:', error);
      }
    };

    fetchBadges();
    // Refresh every 30 seconds
    const interval = setInterval(fetchBadges, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Motif Admin</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const badgeCount = item.badge ? badges[item.badge] : 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {badgeCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
```

---

## 7. Database Migrations

### Migration 001: Add Role System

```sql
-- File: migrations/001_add_role_system.sql

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
ADD COLUMN cheque_size_max INTEGER,
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approved_by UUID REFERENCES profiles(id);

-- Update existing users to 'founder' if role is empty
UPDATE profiles
SET role = 'founder'
WHERE role = '' OR role IS NULL;
```

### Migration 002: Create Startups Table

```sql
-- File: migrations/002_create_startups_table.sql

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
  stage VARCHAR(50) CHECK (stage IN ('pre_seed', 'seed', 'series_a', 'series_b', 'series_c_plus')),
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

-- VCs can view approved startups only (if matched)
CREATE POLICY "VCs can view matched startups"
ON startups FOR SELECT
USING (
  approved_for_vc = TRUE
  AND EXISTS (
    SELECT 1 FROM vc_startup_matches
    WHERE vc_startup_matches.vc_id = auth.uid()
      AND vc_startup_matches.startup_id = startups.id
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

### Migration 006: Security Triggers

```sql
-- File: migrations/006_security_triggers.sql

-- Prevent users from changing their own role
CREATE OR REPLACE FUNCTION prevent_role_self_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if role is being changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Only super_admins can change roles
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    ) THEN
      RAISE EXCEPTION 'You cannot change your own role. Contact an administrator.';
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

## 8. Backend Endpoints (Spring Boot)

### Admin Controller

```java
// AdminController.java

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/stats")
    public AdminStats getStats() {
        return adminService.getStats();
    }

    @GetMapping("/users")
    public Page<UserProfile> getUsers(
        @RequestParam(required = false) String role,
        @RequestParam(required = false) String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        return adminService.getUsers(role, status, page, size);
    }

    @PutMapping("/users/{id}/role")
    public void updateUserRole(
        @PathVariable UUID id,
        @RequestParam String role
    ) {
        adminService.updateUserRole(id, role);
    }

    @GetMapping("/startups/pending")
    public List<Startup> getPendingStartups() {
        return adminService.getPendingStartups();
    }

    @PostMapping("/startups/{id}/approve")
    public void approveStartup(@PathVariable UUID id) {
        adminService.approveStartup(id);
    }

    @PostMapping("/startups/{id}/reject")
    public void rejectStartup(
        @PathVariable UUID id,
        @RequestParam String reason
    ) {
        adminService.rejectStartup(id, reason);
    }

    @GetMapping("/vc-applications")
    public List<VCApplication> getVCApplications(
        @RequestParam(required = false) String status
    ) {
        return adminService.getVCApplications(status);
    }

    @PostMapping("/vc-applications/{id}/approve")
    public void approveVC(@PathVariable UUID id) {
        adminService.approveVCApplication(id);
    }

    @GetMapping("/intros")
    public List<IntroRequest> getIntroRequests(
        @RequestParam(required = false) String status
    ) {
        return adminService.getIntroRequests(status);
    }

    @PostMapping("/intros/{id}/approve")
    public void approveIntro(@PathVariable UUID id) {
        adminService.approveIntro(id);
    }

    @PostMapping("/intros/{id}/reject")
    public void rejectIntro(
        @PathVariable UUID id,
        @RequestParam String reason
    ) {
        adminService.rejectIntro(id, reason);
    }
}
```

### VC Controller

```java
// VCController.java

@RestController
@RequestMapping("/api/vc")
@PreAuthorize("hasRole('VC')")
public class VCController {

    @Autowired
    private VCService vcService;

    @GetMapping("/matches")
    public List<StartupMatch> getMatches(
        @RequestParam(required = false) String stage,
        @RequestParam(required = false) String industry,
        @RequestParam(required = false) Double minScore
    ) {
        UUID vcId = getCurrentUserId();
        return vcService.getMatchedStartups(vcId, stage, industry, minScore);
    }

    @GetMapping("/startups/{id}")
    public Startup getStartupDetail(@PathVariable UUID id) {
        UUID vcId = getCurrentUserId();
        // Validate VC has access to this startup
        if (!vcService.hasAccessToStartup(vcId, id)) {
            throw new AccessDeniedException("You do not have access to this startup");
        }
        return vcService.getStartupDetail(id);
    }

    @PostMapping("/startups/{id}/save")
    public void saveStartup(@PathVariable UUID id) {
        UUID vcId = getCurrentUserId();
        vcService.saveStartup(vcId, id);
    }

    @PostMapping("/startups/{id}/pass")
    public void passStartup(@PathVariable UUID id) {
        UUID vcId = getCurrentUserId();
        vcService.passStartup(vcId, id);
    }

    @PostMapping("/startups/{id}/request-intro")
    public IntroRequest requestIntro(
        @PathVariable UUID id,
        @RequestBody IntroRequestData data
    ) {
        UUID vcId = getCurrentUserId();
        return vcService.requestIntro(vcId, id, data);
    }

    @GetMapping("/intros")
    public List<IntroRequest> getMyIntros() {
        UUID vcId = getCurrentUserId();
        return vcService.getIntroRequests(vcId);
    }

    @GetMapping("/saved")
    public List<StartupMatch> getSavedStartups() {
        UUID vcId = getCurrentUserId();
        return vcService.getSavedStartups(vcId);
    }

    @PutMapping("/preferences")
    public void updatePreferences(@RequestBody VCPreferences prefs) {
        UUID vcId = getCurrentUserId();
        vcService.updatePreferences(vcId, prefs);
    }

    @PostMapping("/startups/{id}/note")
    public void saveNote(
        @PathVariable UUID id,
        @RequestParam String note
    ) {
        UUID vcId = getCurrentUserId();
        vcService.saveNote(vcId, id, note);
    }

    private UUID getCurrentUserId() {
        // Extract from Spring Security context
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return UUID.fromString(auth.getName());
    }
}
```

---

## 9. Component Examples

### Startup Card Component

```typescript
// src/components/vc/StartupCard.tsx

import { Link } from 'react-router-dom';
import { MapPin, TrendingUp, Star, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface StartupCardProps {
  startup: {
    id: string;
    name: string;
    tagline: string;
    stage: string;
    industry: string;
    location: string;
    ask_amount: number;
    readiness_score: number;
    match_reason: string;
    saved: boolean;
  };
  onSaveToggle?: () => void;
}

export const StartupCard: React.FC<StartupCardProps> = ({ startup, onSaveToggle }) => {
  const [isSaved, setIsSaved] = useState(startup.saved);
  const [loading, setLoading] = useState(false);

  const handleSaveToggle = async () => {
    setLoading(true);
    try {
      if (isSaved) {
        await apiClient.delete(`/api/vc/startups/${startup.id}/save`);
        toast.success('Removed from saved');
      } else {
        await apiClient.post(`/api/vc/startups/${startup.id}/save`, {});
        toast.success('Saved for later');
      }
      setIsSaved(!isSaved);
      onSaveToggle?.();
    } catch (error) {
      toast.error('Failed to update saved status');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (score: number) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;

    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < fullStars
                ? 'fill-yellow-400 text-yellow-400'
                : i === fullStars && hasHalfStar
                ? 'fill-yellow-200 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-2">{score.toFixed(1)}/5</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{startup.name}</h3>
          <p className="text-gray-600 mt-1">{startup.tagline}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSaveToggle}
          disabled={loading}
        >
          <Bookmark
            className={`h-5 w-5 ${isSaved ? 'fill-primary text-primary' : 'text-gray-400'}`}
          />
        </Button>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant="secondary">{startup.stage}</Badge>
        <Badge variant="outline">{startup.industry}</Badge>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="h-4 w-4 mr-1" />
          {startup.location}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          Ask: ${(startup.ask_amount / 1000000).toFixed(1)}M
        </div>
      </div>

      {/* Readiness Score */}
      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-1">Investor Readiness:</div>
        {renderStars(startup.readiness_score)}
      </div>

      {/* Match Reason */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <div className="text-sm font-medium text-blue-900 mb-1">
          Why this matches your thesis:
        </div>
        <p className="text-sm text-blue-700">{startup.match_reason}</p>
      </div>

      {/* Actions */}
      <div className="flex space-x-3">
        <Button asChild variant="outline" className="flex-1">
          <Link to={`/vc/startups/${startup.id}`}>View Full Profile</Link>
        </Button>
        <Button className="flex-1">Request Intro</Button>
      </div>
    </div>
  );
};
```

---

## 10. Role-Based Navbar Updates

### Update Existing Navbar

```typescript
// src/components/Navbar.tsx (updates)

import { useUser } from '@/contexts/UserContext';
import { UserRole } from '@/types/roles';

const Navbar = () => {
  const { user, profile, isFounder, isVC, isAdmin } = useUser();

  return (
    <nav>
      {/* Logo */}
      <Link to="/">Motif</Link>

      {/* Public links (always visible) */}
      <Link to="/about">About</Link>
      <Link to="/features">Features</Link>

      {/* Founder-only links */}
      {isFounder && (
        <>
          <Link to="/community">Community</Link>
          <Link to="/idea-analyser">Idea Analyzer</Link>
          <Link to="/pitch-creator">Pitch Creator</Link>
          <Link to="/get-funded">Get Funded</Link>
        </>
      )}

      {/* VC-only links */}
      {isVC && (
        <>
          <Link to="/vc/startups">Startups</Link>
          <Link to="/vc/intros">Intros</Link>
        </>
      )}

      {/* Admin-only links */}
      {isAdmin && (
        <Link to="/admin/dashboard">Admin Dashboard</Link>
      )}

      {/* Auth */}
      {user ? (
        <Link to={profile?.role === UserRole.VC ? '/vc/profile' : '/profile'}>
          Profile
        </Link>
      ) : (
        <Link to="/auth">Login</Link>
      )}
    </nav>
  );
};
```

---

**End of Code Snippets**

## Quick Start Guide

1. **Create types file first:**
   ```bash
   # Create directory if needed
   mkdir -p src/types

   # Copy role types from snippet #1
   touch src/types/roles.ts
   ```

2. **Create ProtectedRoute component:**
   ```bash
   # Copy from snippet #2
   touch src/components/ProtectedRoute.tsx
   ```

3. **Update UserContext:**
   - Add role helpers from snippet #3 to existing `src/contexts/UserContext.tsx`

4. **Create layouts:**
   ```bash
   mkdir -p src/layouts
   mkdir -p src/components/vc
   mkdir -p src/components/admin

   # Copy from snippets #5 and #6
   touch src/layouts/VCLayout.tsx
   touch src/layouts/AdminLayout.tsx
   ```

5. **Run database migrations:**
   - Execute migrations from snippet #7 in your Supabase SQL editor

6. **Update App.tsx:**
   - Add role-based routing from snippet #4

7. **Start building pages:**
   - Begin with VC pages (highest priority)
   - Then admin pages
   - Finally update founder pages

---

For full implementation details, see:
- `MOTIF_AUTH_ARCHITECTURE.md` - Complete architecture
- `IMPLEMENTATION_CHECKLIST.md` - Detailed checklist
