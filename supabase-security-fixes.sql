-- =============================================================================
-- Motif — security fixes for the live Supabase project (bklmqmdvuuyssmkftnxd)
-- Each section fixes an issue verified against the live database on 2026-10-07.
-- Safe to re-run. Review, then run in Supabase → SQL Editor (or apply as a migration).
--
-- Trigger guards only act on browser requests (roles `authenticated` / `anon`).
-- The Spring backend connects as `postgres`, so its writes are unaffected.
-- =============================================================================

-- ── Helpers ──────────────────────────────────────────────────────────────────
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.profiles
                 where id = (select auth.uid()) and role in ('super_admin', 'admin'));
$$;
-- anon needs EXECUTE too: the public case_studies policy calls is_admin(), and
-- without it logged-out visitors get "permission denied" (it returns false for them).
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;


-- ── 1. CRITICAL: users can make themselves admin by editing profiles.role ────
-- Allowed from the browser: the app's own backfill of an empty role to 'founder',
-- and admins changing roles. Everything else is rejected.
create or replace function public.guard_profile_role() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.role := 'founder';
  elsif new.role is distinct from old.role then
    if coalesce(old.role, '') in ('', 'no-role') and new.role = 'founder' then
      return new;
    end if;
    if not public.is_admin() then
      raise exception 'Changing your role is not allowed' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_profile_role on public.profiles;
create trigger trg_guard_profile_role before insert or update on public.profiles
  for each row execute function public.guard_profile_role();


-- ── 2. Founders can approve their own startup (idea_analyses.status) ─────────
-- Non-admins may only create drafts / submit for review; approval stays admin-only.
create or replace function public.guard_idea_status() returns trigger
language plpgsql set search_path = public, pg_temp as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.status is null or new.status not in ('draft', 'pending_review') then
      new.status := 'draft';
    end if;
  elsif new.status is distinct from old.status
        and not (coalesce(old.status, 'draft') in ('draft', 'rejected')
                 and new.status = 'pending_review') then
    new.status := old.status;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_idea_status on public.idea_analyses;
create trigger trg_guard_idea_status before insert or update on public.idea_analyses
  for each row execute function public.guard_idea_status();


-- ── 3. Anyone signed in can send notifications to ANY user (phishing) ────────
-- App flows kept: founder → self, VC → founder, admin → anyone.
drop policy if exists "Service can insert notifications" on public.notifications;
drop policy if exists "System can create notifications" on public.notifications;
drop policy if exists notifications_insert_scoped on public.notifications;
create policy notifications_insert_scoped on public.notifications
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    or exists (select 1 from public.profiles p
               where p.id = (select auth.uid()) and p.role in ('vc', 'super_admin', 'admin'))
  );


-- ── 4. vc_form_submissions has RLS disabled (world-readable/writable) ─────────
alter table public.vc_form_submissions enable row level security;
drop policy if exists vcfs_insert_own on public.vc_form_submissions;
drop policy if exists vcfs_select_own on public.vc_form_submissions;
create policy vcfs_insert_own on public.vc_form_submissions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy vcfs_select_own on public.vc_form_submissions
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());


-- ── 5. Unpublished (draft) case studies are readable by anyone ───────────────
drop policy if exists "Anyone can view case studies" on public.case_studies;
drop policy if exists case_studies_select_published on public.case_studies;
create policy case_studies_select_published on public.case_studies
  for select using (status = 'Published' or public.is_admin());


-- ── 6. Function hardening (Supabase security advisor warnings) ───────────────
alter function public.update_idea_upvotes_count()      set search_path = public, pg_temp;
alter function public.set_updated_at()                 set search_path = public, pg_temp;
alter function public.update_idea_analyses_updated_at() set search_path = public, pg_temp;
alter function public.handle_new_user()                set search_path = public, pg_temp;
alter function public.update_idea_comments_count()     set search_path = public, pg_temp;
alter function public.trg_sync_upvotes_count()         set search_path = public, pg_temp;

-- Trigger functions run without EXECUTE grants; nobody should call them via /rpc.
revoke execute on function public.handle_new_user()          from public, anon, authenticated;
revoke execute on function public.trg_sync_upvotes_count()   from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;

-- ── Manual (dashboard) step ──────────────────────────────────────────────────
-- Authentication → Providers → Email → enable "Leaked password protection".
