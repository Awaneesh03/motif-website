-- ============================================================================
-- Fix for Supabase Security Advisor Warnings
-- ============================================================================
-- This script fixes the 3 security warnings shown in Supabase Security Advisor
-- Run this in your Supabase SQL Editor AFTER running database_schema_complete.sql
-- ============================================================================

-- ============================================================================
-- FIX 1 & 2: Function Search Path Mutable
-- ============================================================================
-- The warnings indicate that functions should have a fixed search_path
-- to prevent potential security issues

-- Fix the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- If you have a handle_new_user function, fix it too
-- (This function might be in your existing schema for user creation)
-- Uncomment and modify if you have this function:

/*
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;
*/

-- ============================================================================
-- FIX 3: Leaked Password Protection
-- ============================================================================
-- This warning is about enabling leaked password protection in Supabase Auth
-- This CANNOT be fixed via SQL - it must be done in the Supabase Dashboard

-- To fix this warning:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Authentication → Policies
-- 3. Look for "Password Protection" or "Leaked Password Protection"
-- 4. Enable the toggle for "Check for leaked passwords"
-- 
-- This feature checks user passwords against known leaked password databases
-- and prevents users from using compromised passwords

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- After running this script, go back to:
-- Supabase Dashboard → Advisors → Security Advisor → Refresh
-- 
-- The 2 "Function Search Path Mutable" warnings should be resolved
-- The "Leaked Password Protection" warning requires dashboard action

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- SECURITY DEFINER: Function runs with the privileges of the user who created it
-- SET search_path = public: Fixes the search path to prevent injection attacks
-- 
-- These changes make your functions more secure by preventing potential
-- SQL injection attacks through search_path manipulation
-- ============================================================================
