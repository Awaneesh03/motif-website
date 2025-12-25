import { motion } from 'motion/react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Camera,
  Users,
  Lightbulb,
  BookOpen,
  Mail,
  Linkedin,
  CheckCircle2,
  Shield,
  Bell,
  Trash2,
  Upload,
  X,
  Smile,
  Target,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
  Bug,
} from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabase';

interface ProfilePageProps {
  onNavigate?: (page: string) => void;
}

const emojis = [
  '😊', '🚀', '💡', '🎯', '⭐', '🔥', '💪', '🌟',
  '🎨', '🧠', '👨‍💼', '👩‍💼', '🦄', '🌈', '⚡',
];

// ============================================================================
// 🔒 EXPLICIT STATE MACHINE (5 STATES - DETERMINISTIC)
// ============================================================================
type RenderState =
  | 'auth_loading'
  | 'unauthenticated'
  | 'authenticated_no_profile'
  | 'authenticated_with_profile'
  | 'fatal_error_fallback';

interface ProfileCompletion {
  percentage: number;
  completedSteps: string[];
  pendingSteps: string[];
}

interface InvestorReadiness {
  score: number;
  level: 'Not Ready' | 'Getting Started' | 'In Progress' | 'Nearly Ready' | 'Ready';
  strengths: string[];
  improvements: string[];
}

// ============================================================================
// SAFE CALCULATION FUNCTIONS (ALWAYS RETURN VALID DATA)
// ============================================================================
function calculateProfileCompletion(profile: any, userIdeas: any[]): ProfileCompletion {
  const safeUserIdeas = Array.isArray(userIdeas) ? userIdeas : [];

  const steps = [
    { key: 'basicInfo', label: 'Basic info', check: () => profile?.name && profile?.email },
    { key: 'background', label: 'Founder background', check: () => profile?.about && profile?.about.length > 20 },
    { key: 'linkedin', label: 'LinkedIn profile', check: () => profile?.linkedin },
    { key: 'startupGoals', label: 'Startup goals', check: () => Array.isArray(profile?.startup_goals) && profile?.startup_goals?.length > 0 },
    { key: 'ideaAdded', label: 'Startup idea basics', check: () => safeUserIdeas.length > 0 },
  ];

  const completedSteps = steps.filter(step => {
    try {
      return step.check();
    } catch {
      return false;
    }
  }).map(s => s.label);

  const pendingSteps = steps.filter(step => {
    try {
      return !step.check();
    } catch {
      return true;
    }
  }).map(s => s.label);

  const percentage = Math.round((completedSteps.length / steps.length) * 100);

  return { percentage, completedSteps, pendingSteps };
}

function calculateInvestorReadiness(profile: any, userIdeas: any[]): InvestorReadiness {
  const safeUserIdeas = Array.isArray(userIdeas) ? userIdeas : [];
  const strengths: string[] = [];
  const improvements: string[] = [];
  let score = 0;

  try {
    if (profile?.about && profile?.about?.length > 50) {
      score += 15;
      strengths.push('Strong founder background');
    } else {
      improvements.push('Add detailed founder background');
    }

    if (profile?.linkedin) {
      score += 10;
      strengths.push('LinkedIn profile connected');
    } else {
      improvements.push('Connect LinkedIn profile');
    }

    if (Array.isArray(profile?.startup_goals) && profile?.startup_goals?.length >= 2) {
      score += 10;
      strengths.push('Clear startup goals defined');
    } else {
      improvements.push('Define startup goals');
    }

    if (safeUserIdeas.length > 0) {
      score += 20;
      strengths.push('Ideas documented');

      if (safeUserIdeas.length >= 3) {
        score += 15;
        strengths.push('Multiple ideas explored');
      }
    } else {
      improvements.push('Add and analyze startup ideas');
    }

    if (safeUserIdeas.some(idea => idea?.user_validation)) {
      score += 30;
      strengths.push('Ideas validated with users');
    } else if (safeUserIdeas.length > 0) {
      improvements.push('Validate ideas with potential users');
    }
  } catch (error) {
    console.error('Error calculating investor readiness:', error);
  }

  let level: InvestorReadiness['level'] = 'Not Ready';
  if (score >= 80) level = 'Ready';
  else if (score >= 60) level = 'Nearly Ready';
  else if (score >= 40) level = 'In Progress';
  else if (score >= 20) level = 'Getting Started';

  return { score, level, strengths, improvements };
}

// ============================================================================
// MAIN PROFILE PAGE COMPONENT
// ============================================================================
export function ProfilePage({ onNavigate }: ProfilePageProps) {
  const { user: authUser, profile, setProfile, isLoading: authLoading } = useUser();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  const [currentRenderState, setCurrentRenderState] = useState<RenderState>('auth_loading');
  const [userIdeas, setUserIdeas] = useState<any[]>([]);
  const [userCases, setUserCases] = useState<any[]>([]);
  const [activityTimeline, setActivityTimeline] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [profileCreationAttempted, setProfileCreationAttempted] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    connections: 0,
    ideasSaved: 0,
    caseStudiesSaved: 0,
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    about: '',
    linkedin: '',
    role: '',
    location: '',
    education: '',
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    about: '',
    linkedin: '',
    role: '',
    location: '',
    education: '',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [settings, setSettings] = useState({
    makeIdeasPublic: true,
    emailUpdates: true,
    aiInsights: true,
  });

  // ============================================================================
  // 🔒 DETERMINISTIC STATE CALCULATION (ALWAYS RUNS)
  // ============================================================================
  useEffect(() => {
    try {
      // STATE 1: Auth still loading
      if (authLoading) {
        setCurrentRenderState('auth_loading');
        return;
      }

      // STATE 2: Not authenticated
      if (!authUser) {
        setCurrentRenderState('unauthenticated');
        return;
      }

      // STATE 3 & 4: Authenticated - check profile
      if (authUser && !profile && !profileCreationAttempted) {
        // Force create profile for new users
        setCurrentRenderState('authenticated_no_profile');
        forceCreateProfile(authUser);
        return;
      }

      // STATE 4: Authenticated with profile
      if (authUser && profile) {
        setCurrentRenderState('authenticated_with_profile');
        return;
      }

      // STATE 3: Authenticated but no profile (after creation attempt)
      if (authUser && !profile && profileCreationAttempted) {
        setCurrentRenderState('authenticated_no_profile');
        return;
      }

      // STATE 5: Fallback for any edge case
      setCurrentRenderState('fatal_error_fallback');
    } catch (error) {
      console.error('Error in state calculation:', error);
      setFatalError(String(error));
      setCurrentRenderState('fatal_error_fallback');
    }
  }, [authLoading, authUser, profile, profileCreationAttempted]);

  // ============================================================================
  // FORCE PROFILE CREATION ON FIRST VISIT
  // ============================================================================
  const forceCreateProfile = async (user: any) => {
    if (profileCreationAttempted) return;

    try {
      setProfileCreationAttempted(true);
      setDataLoading(true);

      const defaultProfile = {
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        about: '',
        linkedin: '',
        avatar: user.user_metadata?.avatar_url || '',
        role: '',
        location: '',
        education: '',
        startup_goals: [],
        connections: 0,
        ideasSaved: 0,
        caseStudiesSaved: 0,
        profileCompleted: false,
        currentStage: 'onboarding',
      };

      // Set profile immediately in memory
      setProfile(defaultProfile as any);

      // Try to save to database (non-blocking)
      const { error } = await supabase
        .from('profiles')
        .upsert([defaultProfile], { onConflict: 'id' });

      if (error) {
        console.error('Failed to save profile to database:', error);
        // Continue anyway - we have in-memory profile
      } else {
        console.log('✅ Profile auto-created in database');
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      // Continue anyway - profile might exist in memory
    } finally {
      setDataLoading(false);
    }
  };

  // ============================================================================
  // LOAD USER DATA (NON-BLOCKING)
  // ============================================================================
  useEffect(() => {
    if (authUser && currentRenderState === 'authenticated_with_profile') {
      loadUserData();
    }
  }, [authUser, currentRenderState]);

  const loadUserData = async () => {
    if (!authUser) return;

    try {
      setDataLoading(true);

      // Load ideas
      const { data: ideas, error: ideasError } = await supabase
        .from('idea_analyses')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (!ideasError && Array.isArray(ideas)) {
        setUserIdeas(ideas);
        setStats(prev => ({ ...prev, ideasSaved: ideas.length }));
      } else {
        setUserIdeas([]);
      }

      // Load case studies
      const { data: cases, error: casesError } = await supabase
        .from('user_attempts')
        .select('*')
        .eq('user_id', authUser.id)
        .order('attempted_at', { ascending: false });

      if (!casesError && Array.isArray(cases)) {
        setUserCases(cases);
        setStats(prev => ({ ...prev, caseStudiesSaved: cases.length }));
      } else {
        setUserCases([]);
      }

      // Build timeline
      const timeline: any[] = [];
      if (Array.isArray(ideas)) {
        ideas.forEach(idea => {
          timeline.push({
            type: 'idea',
            title: 'Idea analyzed',
            description: idea?.idea_title || 'Untitled idea',
            date: idea?.created_at || new Date().toISOString(),
            icon: 'lightbulb',
          });
        });
      }
      if (Array.isArray(cases)) {
        cases.forEach(caseItem => {
          timeline.push({
            type: 'case',
            title: 'Case study completed',
            description: caseItem?.case_id || 'Case study',
            date: caseItem?.attempted_at || new Date().toISOString(),
            icon: 'book',
          });
        });
      }

      timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivityTimeline(timeline.slice(0, 5));
    } catch (error) {
      console.error('Error loading user data:', error);
      // Continue with empty data
      setUserIdeas([]);
      setUserCases([]);
      setActivityTimeline([]);
    } finally {
      setDataLoading(false);
    }
  };

  // ============================================================================
  // SAFE PROFILE WITH FALLBACKS
  // ============================================================================
  const displayProfile = useMemo(() => {
    return profile || {
      id: authUser?.id || '',
      name: authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'User',
      email: authUser?.email || '',
      about: '',
      linkedin: '',
      avatar: authUser?.user_metadata?.avatar_url || '',
      role: '',
      location: '',
      education: '',
      startup_goals: [],
      connections: 0,
      ideasSaved: 0,
      caseStudiesSaved: 0,
    };
  }, [profile, authUser]);

  // ============================================================================
  // CALCULATIONS (WITH SAFE DEFAULTS)
  // ============================================================================
  const profileCompletion = useMemo(
    () => calculateProfileCompletion(displayProfile, userIdeas),
    [displayProfile, userIdeas]
  );

  const investorReadiness = useMemo(
    () => calculateInvestorReadiness(displayProfile, userIdeas),
    [displayProfile, userIdeas]
  );

  const isFirstTimeUser = profileCompletion.percentage < 50;

  // ============================================================================
  // HELPER: Safe display name (never empty)
  // ============================================================================
  const getDisplayName = () => {
    const name = displayProfile?.name?.trim();
    if (name && name.length > 0) return name;
    return 'there'; // Fallback for "Welcome, there!"
  };

  const getFirstName = () => {
    const fullName = getDisplayName();
    if (fullName === 'there') return fullName;
    return fullName.split(' ')[0];
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleEditProfile = () => {
    setEditForm({
      name: displayProfile.name || '',
      email: displayProfile.email || '',
      about: displayProfile.about || '',
      linkedin: displayProfile.linkedin || '',
      role: displayProfile.role || '',
      location: displayProfile.location || '',
      education: displayProfile.education || '',
    });
    setSelectedGoals(Array.isArray(displayProfile.startup_goals) ? displayProfile.startup_goals : []);
    setIsEditOpen(true);
  };

  const validateForm = () => {
    const errors = {
      name: '',
      email: '',
      about: '',
      linkedin: '',
      role: '',
      location: '',
      education: '',
    };

    let isValid = true;

    if (!editForm.name || editForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editForm.email || !emailRegex.test(editForm.email)) {
      errors.email = 'Please enter a valid email';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    if (!authUser) return;

    try {
      const updatedProfile = {
        ...displayProfile,
        name: editForm.name,
        email: editForm.email,
        about: editForm.about,
        linkedin: editForm.linkedin,
        role: editForm.role,
        location: editForm.location,
        education: editForm.education,
        startup_goals: selectedGoals,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updatedProfile)
        .eq('id', authUser.id);

      if (error) throw error;

      setProfile(updatedProfile as any);
      setIsEditOpen(false);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleAvatarChange = async (emoji: string) => {
    if (!authUser) return;

    try {
      const updatedProfile = { ...displayProfile, avatar: emoji };

      const { error } = await supabase
        .from('profiles')
        .update({ avatar: emoji })
        .eq('id', authUser.id);

      if (error) throw error;

      setProfile(updatedProfile as any);
      setIsAvatarModalOpen(false);
      toast.success('Avatar updated!');
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      toast.error(error.message || 'Failed to update avatar');
    }
  };

  const handleDeleteAccount = async () => {
    if (!authUser) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(authUser.id);
      if (error) throw error;

      toast.success('Account deleted successfully');
      onNavigate?.('Auth');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account');
    }
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Invalid date';
    }
  };

  // ============================================================================
  // 🐛 DEBUG PANEL (DEV MODE ONLY)
  // ============================================================================
  const DebugPanel = () => {
    // Only show in development mode
    if (import.meta.env.PROD) return null;

    return (
      <Card className="mb-4 border-yellow-500/50 bg-yellow-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bug className="h-5 w-5 text-yellow-500" />
            <h3 className="font-semibold text-yellow-500">Debug Panel (Dev Only)</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Auth Status:</span>{' '}
              <Badge variant={authLoading ? 'secondary' : 'default'}>
                {authLoading ? 'LOADING' : 'LOADED'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">User Exists:</span>{' '}
              <Badge variant={authUser ? 'default' : 'destructive'}>
                {authUser ? 'YES' : 'NO'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Profile Exists:</span>{' '}
              <Badge variant={profile ? 'default' : 'destructive'}>
                {profile ? 'YES' : 'NO'}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Current State:</span>{' '}
              <Badge variant="outline" className="font-mono text-xs">
                {currentRenderState}
              </Badge>
            </div>
          </div>
          {fatalError && (
            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/50 rounded text-xs text-red-500">
              Error: {fatalError}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ============================================================================
  // SHARED MODALS
  // ============================================================================
  const renderModals = () => (
    <>
      {/* Goals Selection Modal */}
      <Dialog open={isGoalsModalOpen} onOpenChange={setIsGoalsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Startup Goals</DialogTitle>
            <DialogDescription>Choose the goals that resonate with your startup journey</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {[
              'Build an MVP',
              'Get first users',
              'Raise funding',
              'Find co-founder',
              'Validate idea',
              'Launch product',
              'Grow revenue',
              'Scale team',
            ].map(goal => (
              <Button
                key={goal}
                variant={selectedGoals.includes(goal) ? 'default' : 'outline'}
                className="justify-start"
                onClick={() => toggleGoal(goal)}
              >
                {selectedGoals.includes(goal) && <CheckCircle2 className="mr-2 h-4 w-4" />}
                {goal}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar Selection Modal */}
      <Dialog open={isAvatarModalOpen} onOpenChange={setIsAvatarModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Your Avatar</DialogTitle>
            <DialogDescription>Pick an emoji that represents you</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-5 gap-2 py-4">
            {emojis.map(emoji => (
              <Button
                key={emoji}
                variant="outline"
                className="h-16 text-3xl hover:scale-110 transition-transform"
                onClick={() => {
                  setSelectedEmoji(emoji);
                  handleAvatarChange(emoji);
                }}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your founder profile information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Your full name"
                />
                {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="your@email.com"
                />
                {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="about">About</Label>
              <Textarea
                id="about"
                value={editForm.about}
                onChange={e => setEditForm({ ...editForm, about: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  placeholder="e.g., Founder, CEO"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={editForm.location}
                  onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="e.g., San Francisco, CA"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Education</Label>
              <Input
                id="education"
                value={editForm.education}
                onChange={e => setEditForm({ ...editForm, education: e.target.value })}
                placeholder="e.g., Stanford University"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={editForm.linkedin}
                onChange={e => setEditForm({ ...editForm, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div className="space-y-2">
              <Label>Startup Goals</Label>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsGoalsModalOpen(true)}
              >
                <Target className="mr-2 h-4 w-4" />
                {selectedGoals.length > 0 ? `${selectedGoals.length} goals selected` : 'Select your goals'}
              </Button>
              {selectedGoals.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedGoals.map(goal => (
                    <Badge key={goal} variant="secondary">
                      {goal}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  // ============================================================================
  // 🎨 RENDER STATE MACHINE - NO EARLY RETURNS, ALWAYS SHOWS UI
  // ============================================================================
  const pageBackground = { background: '#0a0a0a' };
  const containerClass = "mx-auto min-h-screen w-full max-w-7xl px-4 py-8";

  return (
    <div style={pageBackground}>
      <div className={containerClass}>
        {/* Debug panel (dev mode only) */}
        <DebugPanel />

        {/* ============================================================================ */}
        {/* STATE 1: AUTH LOADING */}
        {/* ============================================================================ */}
        {currentRenderState === 'auth_loading' && (
          <Card className="w-full max-w-md mx-auto border-border/50" style={{ background: 'rgba(180, 200, 255, 0.05)' }}>
            <CardContent className="p-12 text-center">
              <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
              <h2 className="mb-2 text-xl font-semibold" style={{ color: '#D8E0FF' }}>
                Loading your profile...
              </h2>
              <p className="text-muted-foreground text-sm">
                Please wait while we fetch your information
              </p>
            </CardContent>
          </Card>
        )}

        {/* ============================================================================ */}
        {/* STATE 2: UNAUTHENTICATED */}
        {/* ============================================================================ */}
        {currentRenderState === 'unauthenticated' && (
          <Card className="w-full max-w-md mx-auto border-border/50" style={{ background: 'rgba(180, 200, 255, 0.05)' }}>
            <CardContent className="p-8 text-center">
              <Users className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
              <h2 className="mb-2 text-2xl font-bold" style={{ color: '#D8E0FF' }}>Profile Not Available</h2>
              <p className="text-muted-foreground mb-6">
                Please log in to view your profile.
              </p>
              <Button
                className="gradient-lavender shadow-lavender rounded-[16px] hover:opacity-90"
                onClick={() => onNavigate?.('Auth')}
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ============================================================================ */}
        {/* STATE 3: AUTHENTICATED BUT NO PROFILE (ONBOARDING) */}
        {/* ============================================================================ */}
        {currentRenderState === 'authenticated_no_profile' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="w-full max-w-2xl mx-auto border-border/50" style={{ background: 'rgba(180, 200, 255, 0.05)' }}>
              <CardContent className="p-12 text-center">
                <Sparkles className="text-primary mx-auto mb-6 h-20 w-20" />
                <h1 className="mb-4 text-4xl font-bold" style={{ color: '#D8E0FF' }}>
                  Welcome to Motif
                </h1>
                <p className="text-muted-foreground mb-8 text-lg">
                  Let's get your founder profile set up
                </p>

                {dataLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Setting up your profile...</span>
                  </div>
                ) : (
                  <>
                    <div className="mb-8 grid gap-4 text-left">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold">Build Your Founder Profile</h3>
                          <p className="text-muted-foreground text-sm">Share your background and startup goals</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold">Analyze Startup Ideas</h3>
                          <p className="text-muted-foreground text-sm">Get AI-powered insights on your concepts</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                        <div>
                          <h3 className="font-semibold">Connect with VCs</h3>
                          <p className="text-muted-foreground text-sm">Find investors aligned with your vision</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="gradient-lavender shadow-lavender rounded-[16px] hover:opacity-90"
                      onClick={handleEditProfile}
                    >
                      Start Profile Setup
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ============================================================================ */}
        {/* STATE 4: AUTHENTICATED WITH PROFILE (MAIN DASHBOARD) */}
        {/* ============================================================================ */}
        {currentRenderState === 'authenticated_with_profile' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {isFirstTimeUser ? (
              // FIRST-TIME USER ONBOARDING VIEW
              <div className="space-y-6">
                {/* Welcome Header */}
                <Card className="border-border/50" style={{ background: 'rgba(180, 200, 255, 0.05)' }}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
                          <AvatarImage src={displayProfile.avatar} />
                          <AvatarFallback className="text-2xl">{getDisplayName()?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h1 className="text-2xl font-bold" style={{ color: '#D8E0FF' }}>
                            Welcome, {getFirstName()}!
                          </h1>
                          <p className="text-muted-foreground">Let's build your founder profile together</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={handleEditProfile}>
                        Edit Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Profile Completion */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Profile Completion
                      </CardTitle>
                      <Badge variant="secondary">{profileCompletion.percentage}% Complete</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Progress value={profileCompletion.percentage} className="h-2" />
                    <div className="grid gap-3">
                      {profileCompletion.completedSteps.map(step => (
                        <div key={step} className="flex items-center gap-2">
                          <CheckCircle2 className="text-primary h-4 w-4" />
                          <span className="text-sm">{step}</span>
                        </div>
                      ))}
                      {profileCompletion.pendingSteps.map(step => (
                        <div key={step} className="flex items-center gap-2">
                          <AlertCircle className="text-muted-foreground h-4 w-4" />
                          <span className="text-muted-foreground text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full" onClick={handleEditProfile}>
                      Complete Your Profile
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="cursor-pointer transition-all hover:shadow-lg" onClick={() => onNavigate?.('IdeaAnalyser')}>
                    <CardContent className="p-6">
                      <Lightbulb className="text-primary mb-4 h-10 w-10" />
                      <h3 className="mb-2 text-lg font-semibold">Analyze Your First Idea</h3>
                      <p className="text-muted-foreground text-sm">
                        Get AI-powered insights on your startup concept
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer transition-all hover:shadow-lg" onClick={() => onNavigate?.('VCConnection')}>
                    <CardContent className="p-6">
                      <Users className="text-primary mb-4 h-10 w-10" />
                      <h3 className="mb-2 text-lg font-semibold">Connect with VCs</h3>
                      <p className="text-muted-foreground text-sm">
                        Find investors who match your vision
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              // RETURNING USER DASHBOARD VIEW
              <div className="space-y-6">
                {/* Profile Header */}
                <Card className="border-border/50" style={{ background: 'rgba(180, 200, 255, 0.05)' }}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-6">
                        <Avatar className="h-20 w-20 cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
                          <AvatarImage src={displayProfile.avatar} />
                          <AvatarFallback className="text-3xl">{getDisplayName()?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h1 className="text-3xl font-bold" style={{ color: '#D8E0FF' }}>
                            {getDisplayName()}
                          </h1>
                          {displayProfile.role && (
                            <p className="text-muted-foreground text-lg">{displayProfile.role}</p>
                          )}
                          {displayProfile.location && (
                            <p className="text-muted-foreground text-sm">{displayProfile.location}</p>
                          )}
                          <div className="mt-2 flex gap-2">
                            {displayProfile.email && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={`mailto:${displayProfile.email}`}>
                                  <Mail className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {displayProfile.linkedin && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={displayProfile.linkedin} target="_blank" rel="noopener noreferrer">
                                  <Linkedin className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" onClick={handleEditProfile}>
                        Edit Profile
                      </Button>
                    </div>

                    {displayProfile.about && (
                      <div className="mt-6">
                        <p className="text-muted-foreground">{displayProfile.about}</p>
                      </div>
                    )}

                    {Array.isArray(displayProfile?.startup_goals) && displayProfile?.startup_goals?.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-medium">Startup Goals:</p>
                        <div className="flex flex-wrap gap-2">
                          {displayProfile.startup_goals.map(goal => (
                            <Badge key={goal} variant="secondary">
                              {goal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-muted-foreground text-sm">Ideas Analyzed</p>
                          <p className="text-3xl font-bold">{stats.ideasSaved}</p>
                        </div>
                        <Lightbulb className="text-primary h-10 w-10" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-muted-foreground text-sm">Case Studies</p>
                          <p className="text-3xl font-bold">{stats.caseStudiesSaved}</p>
                        </div>
                        <BookOpen className="text-primary h-10 w-10" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-muted-foreground text-sm">Connections</p>
                          <p className="text-3xl font-bold">{stats.connections}</p>
                        </div>
                        <Users className="text-primary h-10 w-10" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Investor Readiness */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Investor Readiness
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">{investorReadiness.score}/100</p>
                        <p className="text-muted-foreground text-sm">{investorReadiness.level}</p>
                      </div>
                      <Progress value={investorReadiness.score} className="h-2 w-48" />
                    </div>

                    {investorReadiness.strengths.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium">Strengths:</p>
                        <div className="space-y-1">
                          {investorReadiness.strengths.map(strength => (
                            <div key={strength} className="flex items-center gap-2">
                              <CheckCircle2 className="text-primary h-4 w-4" />
                              <span className="text-sm">{strength}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {investorReadiness.improvements.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium">Areas to Improve:</p>
                        <div className="space-y-1">
                          {investorReadiness.improvements.map(improvement => (
                            <div key={improvement} className="flex items-center gap-2">
                              <TrendingUp className="text-muted-foreground h-4 w-4" />
                              <span className="text-muted-foreground text-sm">{improvement}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Activity Timeline */}
                {activityTimeline.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {activityTimeline.map((activity, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="bg-primary/10 mt-1 rounded-full p-2">
                              {activity.icon === 'lightbulb' && <Lightbulb className="text-primary h-4 w-4" />}
                              {activity.icon === 'book' && <BookOpen className="text-primary h-4 w-4" />}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{activity.title}</p>
                              <p className="text-muted-foreground text-sm">{activity.description}</p>
                              <p className="text-muted-foreground text-xs mt-1">{formatDate(activity.date)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Account Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Account Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Make ideas public</p>
                        <p className="text-muted-foreground text-sm">Allow others to view your analyzed ideas</p>
                      </div>
                      <Switch
                        checked={settings.makeIdeasPublic}
                        onCheckedChange={checked => setSettings({ ...settings, makeIdeasPublic: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email updates</p>
                        <p className="text-muted-foreground text-sm">Receive updates about your startup journey</p>
                      </div>
                      <Switch
                        checked={settings.emailUpdates}
                        onCheckedChange={checked => setSettings({ ...settings, emailUpdates: checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">AI insights</p>
                        <p className="text-muted-foreground text-sm">Get personalized recommendations</p>
                      </div>
                      <Switch
                        checked={settings.aiInsights}
                        onCheckedChange={checked => setSettings({ ...settings, aiInsights: checked })}
                      />
                    </div>

                    <div className="border-t pt-4">
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setShowDeleteModal(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        )}

        {/* ============================================================================ */}
        {/* STATE 5: FATAL ERROR FALLBACK (HARDCODED - ALWAYS WORKS) */}
        {/* ============================================================================ */}
        {currentRenderState === 'fatal_error_fallback' && (
          <Card className="w-full max-w-2xl mx-auto border-red-500/50 bg-red-500/5">
            <CardContent className="p-12 text-center">
              <AlertCircle className="mx-auto mb-6 h-20 w-20 text-red-500" />
              <h1 className="mb-4 text-4xl font-bold text-red-500">
                Something Went Wrong
              </h1>
              <p className="text-muted-foreground mb-8 text-lg">
                We encountered an unexpected error, but don't worry - your data is safe.
              </p>

              <div className="mb-8 rounded-lg bg-red-500/10 p-4 text-left">
                <p className="text-sm font-mono text-red-400">
                  {fatalError || 'Unknown error occurred'}
                </p>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
                <Button
                  className="gradient-lavender shadow-lavender rounded-[16px]"
                  onClick={() => onNavigate?.('Home')}
                >
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modals - Always Rendered */}
        {renderModals()}
      </div>
    </div>
  );
}
