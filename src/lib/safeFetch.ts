/**
 * Safe Fetch Utility for Supabase Queries
 *
 * Wraps Supabase queries to gracefully handle RLS 400 errors and permission denials.
 * Converts expected RLS blocks into safe fallback values instead of throwing errors.
 *
 * RATIONALE:
 * - RLS policies return 400 when users query data they shouldn't access
 * - This is EXPECTED behavior, not an error
 * - We should return empty results instead of logging errors
 */

import { PostgrestError } from '@supabase/supabase-js';

export interface SafeFetchOptions {
  /**
   * Enable debug logging for this query
   * Default: false
   */
  debug?: boolean;

  /**
   * Service name for logging context
   * Example: 'notificationService', 'introRequestService'
   */
  serviceName?: string;
}

/**
 * Check if error is an RLS permission denial (400 error)
 */
const isRLSPermissionError = (error: PostgrestError | null): boolean => {
  if (!error) return false;

  // Check for HTTP 400 status or permission-related error codes
  const is400Error = error.code === 'PGRST116' || error.message?.includes('400');
  const isPermissionError =
    error.code === '42501' || // insufficient_privilege
    error.message?.toLowerCase().includes('permission') ||
    error.message?.toLowerCase().includes('policy');

  return is400Error || isPermissionError;
};

/**
 * Check if error is a missing table error (42P01)
 */
const isMissingTableError = (error: PostgrestError | null): boolean => {
  if (!error) return false;
  return error.code === '42P01' || error.message?.includes('does not exist');
};

/**
 * Safe fetch for queries that return a list
 * Converts RLS 400 errors into empty arrays
 */
export async function safeFetchList<T>(
  queryFn: () => Promise<{ data: T[] | null; error: PostgrestError | null }>,
  options: SafeFetchOptions = {}
): Promise<T[]> {
  try {
    const { data, error } = await queryFn();

    if (error) {
      // RLS permission error - return empty array (expected behavior)
      if (isRLSPermissionError(error)) {
        if (options.debug) {
          console.info(
            `[${options.serviceName || 'safeFetch'}] RLS blocked query (expected) - returning []`
          );
        }
        return [];
      }

      // Missing table - return empty array (feature not enabled)
      if (isMissingTableError(error)) {
        if (options.debug) {
          console.info(
            `[${options.serviceName || 'safeFetch'}] Table not found (feature disabled) - returning []`
          );
        }
        return [];
      }

      // Other errors - log but still return empty array
      if (import.meta.env.DEV) {
        console.warn(
          `[${options.serviceName || 'safeFetch'}] Query failed:`,
          error.message
        );
      }
      return [];
    }

    return data || [];
  } catch (err) {
    // Unexpected error - log and return empty array
    if (import.meta.env.DEV) {
      console.warn(
        `[${options.serviceName || 'safeFetch'}] Unexpected error:`,
        err
      );
    }
    return [];
  }
}

/**
 * Safe fetch for queries that return a single item
 * Converts RLS 400 errors into null
 */
export async function safeFetchSingle<T>(
  queryFn: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  options: SafeFetchOptions = {}
): Promise<T | null> {
  try {
    const { data, error } = await queryFn();

    if (error) {
      // RLS permission error - return null (expected behavior)
      if (isRLSPermissionError(error)) {
        if (options.debug) {
          console.info(
            `[${options.serviceName || 'safeFetch'}] RLS blocked query (expected) - returning null`
          );
        }
        return null;
      }

      // Missing table - return null (feature not enabled)
      if (isMissingTableError(error)) {
        if (options.debug) {
          console.info(
            `[${options.serviceName || 'safeFetch'}] Table not found (feature disabled) - returning null`
          );
        }
        return null;
      }

      // Other errors - log but still return null
      if (import.meta.env.DEV) {
        console.warn(
          `[${options.serviceName || 'safeFetch'}] Query failed:`,
          error.message
        );
      }
      return null;
    }

    return data;
  } catch (err) {
    // Unexpected error - log and return null
    if (import.meta.env.DEV) {
      console.warn(
        `[${options.serviceName || 'safeFetch'}] Unexpected error:`,
        err
      );
    }
    return null;
  }
}

/**
 * Safe fetch for count queries
 * Converts RLS 400 errors into 0
 */
export async function safeFetchCount(
  queryFn: () => Promise<{ count: number | null; error: PostgrestError | null }>,
  options: SafeFetchOptions = {}
): Promise<number> {
  try {
    const { count, error } = await queryFn();

    if (error) {
      // RLS permission error - return 0 (expected behavior)
      if (isRLSPermissionError(error)) {
        if (options.debug) {
          console.info(
            `[${options.serviceName || 'safeFetch'}] RLS blocked count (expected) - returning 0`
          );
        }
        return 0;
      }

      // Missing table - return 0 (feature not enabled)
      if (isMissingTableError(error)) {
        if (options.debug) {
          console.info(
            `[${options.serviceName || 'safeFetch'}] Table not found (feature disabled) - returning 0`
          );
        }
        return 0;
      }

      // Other errors - log but still return 0
      if (import.meta.env.DEV) {
        console.warn(
          `[${options.serviceName || 'safeFetch'}] Count query failed:`,
          error.message
        );
      }
      return 0;
    }

    return count || 0;
  } catch (err) {
    // Unexpected error - log and return 0
    if (import.meta.env.DEV) {
      console.warn(
        `[${options.serviceName || 'safeFetch'}] Unexpected error:`,
        err
      );
    }
    return 0;
  }
}

/**
 * Safe fetch for boolean check queries (exists checks)
 * Converts RLS 400 errors into false
 */
export async function safeFetchExists(
  queryFn: () => Promise<{ data: any | null; error: PostgrestError | null }>,
  options: SafeFetchOptions = {}
): Promise<boolean> {
  try {
    const { data, error } = await queryFn();

    if (error) {
      // RLS permission error - return false (expected behavior)
      if (isRLSPermissionError(error)) {
        if (options.debug) {
          console.info(
            `[${options.serviceName || 'safeFetch'}] RLS blocked exists check (expected) - returning false`
          );
        }
        return false;
      }

      // Missing table - return false (feature not enabled)
      if (isMissingTableError(error)) {
        if (options.debug) {
          console.info(
            `[${options.serviceName || 'safeFetch'}] Table not found (feature disabled) - returning false`
          );
        }
        return false;
      }

      // Other errors - log but still return false
      if (import.meta.env.DEV) {
        console.warn(
          `[${options.serviceName || 'safeFetch'}] Exists query failed:`,
          error.message
        );
      }
      return false;
    }

    return !!data;
  } catch (err) {
    // Unexpected error - log and return false
    if (import.meta.env.DEV) {
      console.warn(
        `[${options.serviceName || 'safeFetch'}] Unexpected error:`,
        err
      );
    }
    return false;
  }
}
