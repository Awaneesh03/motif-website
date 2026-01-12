# Error Boundary Architecture

## 🏗️ COMPONENT HIERARCHY

```
App (Root)
│
├─── UserProvider (Context)
│    │
│    └─── AppContent
│         │
│         ├─── AdminLayout ──────────┐
│         │    │                      │
│         │    ├─── AdminNavbar       │
│         │    │                      │
│         │    └─── <main>            │ ErrorBoundary
│         │         │                 │ (Admin Portal)
│         │         └─── ErrorBoundary ◄──┘
│         │              │
│         │              └─── <Outlet>
│         │                   │
│         │                   ├─── AdminDashboard
│         │                   ├─── AdminStartups
│         │                   └─── AdminIntroRequests
│         │
│         ├─── VCLayout ────────────┐
│         │    │                     │
│         │    ├─── VCNavbar         │
│         │    │                     │
│         │    └─── <main>           │ ErrorBoundary
│         │         │                │ (VC Portal)
│         │         └─── ErrorBoundary ◄──┘
│         │              │
│         │              └─── <Outlet>
│         │                   │
│         │                   ├─── VCDashboard
│         │                   ├─── VCStartups
│         │                   └─── VCStartupDetail
│         │
│         └─── Main App Routes ─────┐
│              │                     │
│              ├─── Navbar           │
│              │                     │
│              ├─── <main>           │ ErrorBoundary
│              │    │                │ (Founder + Public)
│              │    └─── ErrorBoundary ◄──┘
│              │         │
│              │         └─── <Routes>
│              │              │
│              │              ├─── Public Routes
│              │              │    ├─── HomePage
│              │              │    ├─── AboutPage
│              │              │    ├─── FeaturesPage
│              │              │    └─── ...
│              │              │
│              │              └─── Founder Routes (Protected)
│              │                   ├─── DashboardPage
│              │                   ├─── IdeaAnalyserPage
│              │                   ├─── PitchCreatorPage
│              │                   └─── ...
│              │
│              ├─── Footer
│              └─── Chatbot
```

---

## 🛡️ ERROR ISOLATION ZONES

### Zone 1: Admin Portal
**Boundary Location:** `src/layouts/AdminLayout.tsx`
**Protected Routes:**
- `/admin/dashboard`
- `/admin/startups`
- `/admin/intro-requests`

**Recovery:**
- Try Again (reload)
- Go to Dashboard (`/admin/dashboard`)

**Impact:** Admin portal errors do NOT affect VC or Founder areas.

---

### Zone 2: VC Portal
**Boundary Location:** `src/layouts/VCLayout.tsx`
**Protected Routes:**
- `/vc/dashboard`
- `/vc/startups`
- `/vc/startups/:id`

**Recovery:**
- Try Again (reload)
- Go to Dashboard (`/vc/dashboard`)

**Impact:** VC portal errors do NOT affect Admin or Founder areas.

---

### Zone 3: Main App (Founder + Public)
**Boundary Location:** `src/App.tsx`
**Protected Routes:**
- Public: `/`, `/about`, `/features`, `/contact`, `/auth`, `/pricing`
- Founder: `/dashboard`, `/idea-analyser`, `/pitch-creator`, `/profile`, etc.

**Recovery:**
- Try Again (reload)
- Reload Page (full refresh)

**Impact:** Main app errors do NOT affect Admin or VC portals.

---

## 🔄 ERROR PROPAGATION

### What Happens When an Error Occurs?

```
Component Error
      ↓
ErrorBoundary Catches
      ↓
Stop Propagation ✋
      ↓
Show Fallback UI
      ↓
User Chooses Action
      ↓
   ┌──────┴──────┐
   ↓             ↓
Try Again    Go to Dashboard
   ↓             ↓
Reload Page   Navigate Away
```

### Error Containment

```
❌ WITHOUT Error Boundaries:
Component Error → Entire App Crashes → White Screen → User Lost

✅ WITH Error Boundaries:
Component Error → Boundary Catches → Show Fallback → User Recovers
                      ↑
                      └── Other routes still work!
```

---

## 📊 COVERAGE BY ROLE

| User Role | Protected Routes | Error Boundary | Recovery Dashboard |
|-----------|-----------------|----------------|-------------------|
| **Public** | 6+ routes | ✅ Main App | N/A (reload only) |
| **Founder** | 10+ routes | ✅ Main App | `/dashboard` |
| **VC** | 3 routes | ✅ VC Layout | `/vc/dashboard` |
| **Admin** | 3 routes | ✅ Admin Layout | `/admin/dashboard` |

---

## 🎨 FALLBACK UI COMPONENTS

### Common Structure (All Boundaries)
```jsx
<div className="flex min-h-[600px] items-center justify-center">
  <div className="max-w-md text-center">
    {/* Icon */}
    <div className="mb-4 bg-red-100">
      <AlertCircle className="text-red-600" />
    </div>

    {/* Message */}
    <h2>Something went wrong</h2>
    <p>Contextual error message...</p>

    {/* Actions */}
    <Button onClick={reload}>Try Again</Button>
    <Button onClick={goToDashboard}>Go to Dashboard</Button>
  </div>
</div>
```

### Customization by Zone
- **Admin:** "An error occurred in the admin panel"
- **VC:** "An error occurred while loading this page"
- **Main App:** Default ErrorBoundary message

---

## 🔍 ERROR MESSAGE HANDLING

### User-Friendly Messages (Production)
```javascript
// src/components/ErrorBoundary.tsx
getErrorMessage(error) {
  if (error.message.includes('not found')) {
    return 'This resource no longer exists. It may have been deleted or moved.'
  }

  if (error.message.includes('Permission denied')) {
    return 'You do not have permission to access this resource.'
  }

  if (error.message.includes('Network')) {
    return 'Network error. Please check your connection and try again.'
  }

  // Default
  return 'An unexpected error occurred. Please try refreshing the page.'
}
```

### Development Mode (Dev Only)
```jsx
{process.env.NODE_ENV === 'development' && (
  <details>
    <summary>Error Details (Development Only)</summary>
    <pre>{error.toString()}</pre>
    <pre>{error.stack}</pre>
  </details>
)}
```

---

## 🚨 ERROR SCENARIOS & RECOVERY

### Scenario 1: Deleted Startup
```
User: Views /vc/startups/123 (deleted startup)
Error: "Startup not found" (PGRST116)
Boundary: Catches error
Fallback: Shows "This resource no longer exists"
Recovery: User clicks "Go to Dashboard" → /vc/dashboard
Result: ✅ VC continues working, navigates to valid page
```

### Scenario 2: Network Timeout
```
User: Loads /admin/startups
Error: Network timeout during data fetch
Boundary: Catches error
Fallback: Shows "Network error. Please check your connection"
Recovery: User clicks "Try Again" → Page reloads → Data loads
Result: ✅ Admin retries successfully
```

### Scenario 3: Component Crash
```
User: Navigates to /dashboard
Error: React component render error (undefined property)
Boundary: Catches error
Fallback: Shows "Something went wrong"
Recovery: User clicks "Try Again" → Component re-renders
Result: ✅ Founder dashboard restored
```

---

## 📈 RESILIENCE LEVELS

### Without Error Boundaries (Before)
```
Resilience: ⚠️ LOW
│
├─── Single error anywhere → Entire app crashes
├─── User sees blank white screen
├─── Must manually refresh entire site
└─── Lost navigation state
```

### With Error Boundaries (After)
```
Resilience: ✅ HIGH
│
├─── Error isolated to specific route
├─── Other routes continue working
├─── User sees friendly recovery UI
├─── Can navigate to working pages
└─── Graceful degradation
```

---

## 🎯 DEFENSE IN DEPTH

```
Layer 1: Component Try/Catch
         ↓ (if error not caught)
Layer 2: ErrorBoundary (Layout Level)
         ↓ (catches render errors)
Layer 3: Show Fallback UI
         ↓ (user-friendly message)
Layer 4: Recovery Actions
         ↓ (navigation or reload)
Layer 5: Platform Remains Functional
```

---

## ✅ PRODUCTION GUARANTEES

1. **No Whole App Crashes** - Errors contained to zones
2. **User Can Always Navigate** - Recovery actions always available
3. **No Sensitive Data Exposed** - Production mode hides details
4. **Graceful Degradation** - Other features keep working
5. **Clear User Feedback** - Friendly error messages
6. **Quick Recovery** - One-click reload or navigation

---

**Architecture Status:** 🔒 **LOCKED & PRODUCTION-READY**
