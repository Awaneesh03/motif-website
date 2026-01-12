import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { UserRole } from '@/types/roles';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  about: string;
  linkedin: string;
  avatar: string;
  role: string;
  location: string;
  education: string;
  startup_goals: string[];
  connections: number;
  ideasSaved: number;
  caseStudiesSaved: number;
}

type UserContextValue = {
  user: User | null;
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  isLoading: boolean;
  loading: boolean; // Alias for compatibility
  isFounder: boolean;
  isVC: boolean;
  isAdmin: boolean;
  hasRole: (role: UserRole) => boolean;
  displayName: string;
  loadingUser: boolean;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string>('there');
  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  const resolveDisplayName = (profile?: { full_name?: string }, authUser?: User | null) => {
    return (
      profile?.full_name ||
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      'there'
    );
  };

  const loadUser = useCallback(async (explicitUser?: User | null) => {
    setLoadingUser(true);
    try {
      let authUser = explicitUser;

      // If no user passed, try to get it from session with timeout
      if (authUser === undefined) {
        const getSessionWithTimeout = async () => {
          const timeoutPromise = new Promise<{ data: { session: null }, error: any }>((resolve) => {
            setTimeout(() => {
              console.warn('[UserContext] loadUser getSession timed out');
              resolve({ data: { session: null }, error: 'Timeout' });
            }, 2000);
          });
          return Promise.race([supabase.auth.getSession(), timeoutPromise]);
        };

        const { data: sessionData } = await getSessionWithTimeout();
        authUser = sessionData.session?.user ?? null;
      }

      setUser(authUser);

      if (authUser) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (!error && profile) {
          // Profile exists - use it
          setProfile(profile);
          setDisplayName(resolveDisplayName(profile, authUser));
        } else {
          // Profile doesn't exist - create one with default founder role
          console.log('[UserContext] Profile not found, creating default profile...');

          const defaultProfile = {
            id: authUser.id,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            about: '',
            linkedin: '',
            avatar: authUser.user_metadata?.avatar_url || '',
            role: 'founder', // Default to founder role
            location: '',
            education: '',
            startup_goals: [],
            connections: 0,
            ideasSaved: 0,
            caseStudiesSaved: 0,
          };

          // Try to insert the profile into the database
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([defaultProfile])
            .select()
            .single();

          if (!insertError && newProfile) {
            console.log('✅ Profile auto-created successfully');
            setProfile(newProfile);
            setDisplayName(resolveDisplayName(newProfile, authUser));
          } else {
            // If insert fails (e.g., RLS policy), use in-memory profile
            console.warn('⚠️ Failed to create profile in database, using in-memory profile:', insertError);
            setProfile(defaultProfile as any);
            setDisplayName(resolveDisplayName(defaultProfile as any, authUser));
          }
        }
      } else {
        setProfile(null);
        setDisplayName('there');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setDisplayName('there');
    } finally {
      setLoadingUser(false);
    }
  }, []);

  useEffect(() => {
    console.log('[UserContext] Initializing auth listener...');

    // Wrap getSession in a race with timeout to prevent hanging
    const getSessionWithTimeout = async () => {
      const timeoutPromise = new Promise<{ data: { session: null }, error: any }>((resolve) => {
        setTimeout(() => {
          console.warn('[UserContext] getSession timed out - defaulting to no user');
          resolve({ data: { session: null }, error: 'Timeout' });
        }, 2000);
      });

      const sessionPromise = supabase.auth.getSession();

      return Promise.race([sessionPromise, timeoutPromise]);
    };

    // Get initial session
    getSessionWithTimeout().then(async ({ data: { session } }) => {
      console.log('[UserContext] Initial session:', session?.user?.email);
      const user = session?.user ?? null;
      setUser(user);

      if (user) {
        console.log('[UserContext] User found, loading profile...');
        try {
          // Pass user explicitly to avoid re-fetching
          await loadUser(user);
        } catch (err) {
          console.error('[UserContext] Error in initial loadUser:', err);
        } finally {
          console.log('[UserContext] Setting isLoading false (initial)');
          setIsLoading(false);
        }
      } else {
        console.log('[UserContext] No user, setting isLoading false');
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[UserContext] Auth change: ${event}`, session?.user?.email);
      const user = session?.user ?? null;
      setUser(user);

      if (user) {
        try {
          // Pass user explicitly - CRITICAL FIX for login hang
          await loadUser(user);
        } catch (err) {
          console.error('[UserContext] Error in auth change loadUser:', err);
        } finally {
          console.log('[UserContext] Setting isLoading false (auth change)');
          setIsLoading(false);
        }
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  // Role helpers (using normalized role values)
  const isFounder = profile?.role === UserRole.FOUNDER || profile?.role === 'founder';
  const isVC = profile?.role === UserRole.VC || profile?.role === 'vc';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'; // Both admin and super_admin

  const hasRole = (role: UserRole) => {
    if (!profile) return false;
    return profile.role === role;
  };

  const value: UserContextValue = {
    user,
    profile,
    setProfile,
    isLoading,
    loading: isLoading, // Alias
    isFounder,
    isVC,
    isAdmin,
    hasRole,
    displayName,
    loadingUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
