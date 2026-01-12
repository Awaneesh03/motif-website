# SUPER ADMIN FIXES - IMPLEMENTATION CHECKLIST

## 1. SUPER ADMIN ACCESS FIX (CRITICAL)
- [ ] Check all role-based access controls
- [ ] Update any manual role checks to include super_admin || admin
- [ ] Verify super admin can access Idea Analyser, Pitch Creator, Case Studies, Community, Dashboards, Notifications

## 2. FIX SUPER ADMIN NAVBAR (UI + UX)
- [ ] Add missing navbar items: Idea Analyser, Pitch Creator, Profile/Logout
- [ ] Ensure proper styling and active route highlighting
- [ ] Make navbar look professional and consistent

## 3. CASE STUDY CREATION (ADMIN FORM)
- [ ] Connect AdminCaseStudyForm to actual database operations
- [ ] Remove mock data and implement real Supabase integration
- [ ] Add route /admin/case-studies/new
- [ ] Ensure form validation and error handling

## 4. NOTIFICATIONS UX FIX
- [ ] Change NotificationBell to show dropdown instead of navigating
- [ ] Implement proper dropdown with recent notifications
- [ ] Add "View all" link option

## 5. SUPER ADMIN FLOW
- [ ] Verify login → admin landing → admin dashboard flow
- [ ] Ensure dashboard shows high-level metrics and admin actions
- [ ] Remove any founder/VC clutter

## 6. IMPLEMENT REAL CHANGES
- [ ] Replace all mock data with actual database operations
- [ ] Ensure all features work end-to-end
- [ ] Test super admin access to everything
