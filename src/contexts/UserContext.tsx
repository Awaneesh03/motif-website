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
  const [isInitialized, setIsInitialized] = useState(false);
  const [displayName, setDisplayName] = useState<string>('there');
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const PROFILE_LOAD_TIMEOUT_MS = 7000;

  const resolveDisplayName = (profile?: { full_name?: string }, authUser?: User | null) => {
    return (
      profile?.full_name ||
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      'there'
    );
  };

  const loadUser = useCallback(async (explicitUser?: User | null, isMounted?: () => boolean) => {
    const checkMounted = isMounted ?? (() => true);
    setLoadingUser(true);
    try {
      let authUser = explicitUser;

      // If no user passed, try to get it from session with timeout
      if (authUser === undefined) {
        const { data: sessionData } = await supabase.auth.getSession();
        authUser = sessionData.session?.user ?? null;
      }

      if (!checkMounted()) return;
      setUser(authUser);

      if (authUser) {
        const profileFetch = supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        const { data: profile, error } = await Promise.race([
          profileFetch,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timed out')), PROFILE_LOAD_TIMEOUT_MS)
          ),
        ]);

        if (!error && profile) {
          // Always map avatar_url (DB column) → avatar (internal property)
          // avatar_url is the single source of truth in the database
          profile.avatar = profile.avatar_url ?? profile.avatar ?? authUser.user_metadata?.avatar_url ?? '';

          // Profile exists - ensure role is set
          if (!profile.role || profile.role === 'no-role') {
            const updatedProfile = { ...profile, role: 'founder' };
            if (!checkMounted()) return;
            setProfile(updatedProfile);
            setDisplayName(resolveDisplayName(updatedProfile, authUser));

            // Best-effort: persist role
            const { error: roleUpdateError } = await supabase
              .from('profiles')
              .update({ role: 'founder' })
              .eq('id', authUser.id);

            if (roleUpdateError) {
              console.warn('[UserContext] Failed to backfill missing role:', roleUpdateError);
            }
          } else {
            if (!checkMounted()) return;
            setProfile(profile);
            setDisplayName(resolveDisplayName(profile, authUser));
          }
        } else {
          // Profile doesn't exist - create one with default founder role
          console.log('[UserContext] Profile not found, creating default profile...');

          const avatarValue = authUser.user_metadata?.avatar_url || '';
          const defaultProfile = {
            id: authUser.id,
            name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            about: '',
            linkedin: '',
            avatar_url: avatarValue,
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
            // Map avatar_url from DB to avatar for internal use
            newProfile.avatar = newProfile.avatar_url || avatarValue;
            if (!checkMounted()) return;
            setProfile(newProfile);
            setDisplayName(resolveDisplayName(newProfile, authUser));
          } else {
            // If insert fails (e.g., RLS policy), use in-memory profile
            console.warn('⚠️ Failed to create profile in database, using in-memory profile:', insertError);
            if (!checkMounted()) return;
            const inMemoryProfile = { ...defaultProfile, avatar: avatarValue };
            setProfile(inMemoryProfile as any);
            setDisplayName(resolveDisplayName(inMemoryProfile as any, authUser));
          }
        }
      } else {
        setProfile(null);
        setDisplayName('there');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      if (explicitUser) {
        const fallbackAvatarUrl = explicitUser.user_metadata?.avatar_url || '';
        const fallbackProfile = {
          id: explicitUser.id,
          name: explicitUser.user_metadata?.full_name || explicitUser.email?.split('@')[0] || 'User',
          email: explicitUser.email || '',
          about: '',
          linkedin: '',
          avatar: fallbackAvatarUrl,
          role: 'founder',
          location: '',
          education: '',
          startup_goals: [],
          connections: 0,
          ideasSaved: 0,
          caseStudiesSaved: 0,
        };
        setProfile(fallbackProfile as any);
        setDisplayName(resolveDisplayName(fallbackProfile as any, explicitUser));
      } else {
        setProfile(null);
        setDisplayName('there');
      }
    } finally {
      setLoadingUser(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // First, try to restore session from storage
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('[UserContext] Session error:', sessionError);
        }

        const sessionUser = sessionData.session?.user ?? null;
        
        if (!isMounted) return;
        
        setUser(sessionUser);

        if (sessionUser) {
          await loadUser(sessionUser, () => isMounted);
        } else {
          setProfile(null);
          setDisplayName('there');
        }
      } catch (error) {
        console.error('[UserContext] Error initializing session:', error);
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setDisplayName('there');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Skip INITIAL_SESSION as we handle it in initializeAuth
      if (event === 'INITIAL_SESSION') return;
      
      const handleAuthChange = async () => {
        const sessionUser = session?.user ?? null;
        
        if (!isMounted) return;
        
        setIsLoading(true);

        if (event === 'SIGNED_IN') {
          setUser(sessionUser);
          if (sessionUser) {
            await loadUser(sessionUser, () => isMounted);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setDisplayName('there');
        } else if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (sessionUser) {
            setUser(sessionUser);
            await loadUser(sessionUser, () => isMounted);
          }
        }
      };

      void handleAuthChange().finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUser]);

  // Role helpers (using normalized role values)
  const isFounder = profile?.role === UserRole.FOUNDER || profile?.role === 'founder';
  const isVC = profile?.role === UserRole.VC || profile?.role === 'vc';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'; // Both admin and super_admin

  const hasRole = (role: UserRole) => {
    if (!profile) return false;
    return profile.role === role;
  };

  // Combine loading states - show loading until fully initialized
  const combinedLoading = !isInitialized || isLoading;

  const value: UserContextValue = {
    user,
    profile,
    setProfile,
    isLoading: combinedLoading,
    loading: combinedLoading, // Alias
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
