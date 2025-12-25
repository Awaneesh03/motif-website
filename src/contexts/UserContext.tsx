import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
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

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  isLoading: boolean;
  loading: boolean; // Alias for compatibility
  isFounder: boolean;
  isVC: boolean;
  isAdmin: boolean;
  hasRole: (role: UserRole) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (user: User) => {
    try {
      // Try to load profile from database
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
      }

      // Check if this is a new user (no profile in database)
      const isNewUser = !data;

      // Create default profile object from user data
      let userProfile: UserProfile = data || {
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        about: '',
        linkedin: '',
        avatar: user.user_metadata?.avatar_url || '',
        role: 'founder', // Default role for new users
        location: '',
        education: '',
        startup_goals: [],
        connections: 0,
        ideasSaved: 0,
        caseStudiesSaved: 0,
      };

      // Auto-create profile in database for new users
      if (isNewUser) {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: userProfile.id,
            name: userProfile.name,
            email: userProfile.email,
            about: userProfile.about,
            linkedin: userProfile.linkedin,
            avatar: userProfile.avatar,
            role: userProfile.role,
            location: userProfile.location,
            education: userProfile.education,
            startup_goals: userProfile.startup_goals,
            connections: userProfile.connections,
            ideasSaved: userProfile.ideasSaved,
            caseStudiesSaved: userProfile.caseStudiesSaved,
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating profile in database:', insertError);
          // Continue with in-memory profile even if database insert fails
        } else if (newProfile) {
          // Use the newly created database profile
          userProfile = newProfile;
          console.log('✅ Profile auto-created in database for new user');
        }
      }

      setProfile(userProfile);

      // Show welcome notification
      setTimeout(() => {
        if (isNewUser) {
          toast.success(`Welcome, ${userProfile.name}! 🎉`, {
            duration: 3000,
            description: 'Get started by exploring ideas and case studies',
          });
        } else {
          toast.success(`Welcome back, ${userProfile.name}! 👋`, {
            duration: 3000,
          });
        }
      }, 500);
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Role helpers
  const isFounder = profile?.role === UserRole.FOUNDER || profile?.role === 'founder';
  const isVC = profile?.role === UserRole.VC || profile?.role === 'vc';
  const isAdmin = profile?.role === UserRole.SUPER_ADMIN || profile?.role === 'super_admin';

  const hasRole = (role: UserRole) => {
    if (!profile) return false;
    return profile.role === role;
  };

  return (
    <UserContext.Provider
      value={{
        user,
        profile,
        setProfile,
        isLoading,
        loading: isLoading, // Alias
        isFounder,
        isVC,
        isAdmin,
        hasRole,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
