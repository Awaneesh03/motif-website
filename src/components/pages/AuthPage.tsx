import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Linkedin } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { supabase, supabaseConfigured, setRememberMe, getRememberMe } from '../../lib/supabase';
import { Checkbox } from '../ui/checkbox';

interface AuthPageProps {
  onNavigate?: (page: string) => void;
  onLogin?: () => void;
}

interface ValidationErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [rememberMe, setRememberMeState] = useState(() => getRememberMe());

  // Clear errors when switching between login/signup
  useEffect(() => {
    setErrors({});
    setTouched({});
  }, [isLogin]);

  // Validation functions
  const validateEmail = (email: string): string | undefined => {
    if (!email) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    return undefined;
  };

  const validateFullName = (name: string): string | undefined => {
    if (!name) {
      return 'Full name is required';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name)) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!isLogin) {
      const nameError = validateFullName(formData.fullName);
      if (nameError) newErrors.fullName = nameError;
    }

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field blur
  const handleBlur = (field: keyof typeof formData) => {
    setTouched({ ...touched, [field]: true });

    const newErrors = { ...errors };

    if (field === 'fullName' && !isLogin) {
      const error = validateFullName(formData.fullName);
      if (error) {
        newErrors.fullName = error;
      } else {
        delete newErrors.fullName;
      }
    }

    if (field === 'email') {
      const error = validateEmail(formData.email);
      if (error) {
        newErrors.email = error;
      } else {
        delete newErrors.email;
      }
    }

    if (field === 'password') {
      const error = validatePassword(formData.password);
      if (error) {
        newErrors.password = error;
      } else {
        delete newErrors.password;
      }
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!supabaseConfigured) {
      toast.error('Supabase credentials are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and restart.');
      return;
    }

    setAuthError(null);
    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      password: true,
    });

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    // Set storage preference before auth call
    setRememberMe(rememberMe);

    setIsLoading(true);
    const loadingTimeout = window.setTimeout(() => {
      setIsLoading(false);
      setAuthError('Login is taking longer than expected. Please try again.');
      toast.error('Login is taking longer than expected. Please try again.');
    }, 10000);

    try {
      if (isLogin) {
        // Handle login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          console.error('Sign-in error:', error);
          const message = error.message || 'Failed to sign in. Please try again.';
          setAuthError(message);
          toast.error(message);
          return;
        }

        if (!data.session) {
          const message = 'No session returned after sign-in.';
          setAuthError(message);
          toast.error(message);
          return;
        }

        toast.success('Signed in successfully. Redirecting…');
        onLogin?.();
      } else {
        // Handle signup
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
            },
          },
        });

        if (error) {
          console.error('Sign-up error:', error);
          const message = error.message || 'Failed to sign up. Please try again.';
          setAuthError(message);
          toast.error(message);
          return;
        }

        // Check if email confirmation is required
        if (data.user && !data.session) {
          toast.success('Account created! Please check your email to verify your account.');
        } else {
          toast.success('Account created successfully!');
          onLogin?.();
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);

      // Provide more detailed error messages
      let errorMessage = 'An error occurred. Please try again.';

      if (error.message) {
        errorMessage = error.message;
      }

      if (error.message?.includes('fetch')) {
        errorMessage = 'Unable to connect to authentication server. Please check your internet connection and Supabase configuration.';
      }

      setAuthError(errorMessage);
      toast.error(errorMessage);
    } finally {
      window.clearTimeout(loadingTimeout);
      setIsLoading(false);
    }
  };

  const handleGoogleLoginSuccess = (credentialResponse: CredentialResponse) => {
    if (!supabaseConfigured) {
      toast.error('Supabase credentials are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and restart.');
      return;
    }
    // In a production app, you would:
    // 1. Send the credential to your backend
    // 2. Verify the token server-side
    // 3. Create a session or JWT token
    // 4. Store user information

    // For now, we'll decode the JWT token to get user info (client-side only for demo)
    if (credentialResponse.credential) {
      try {
        // Decode JWT token (note: this is just for demo, do this server-side in production)
        const base64Url = credentialResponse.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );

        const userData = JSON.parse(jsonPayload);

        // Welcome notification is now handled by UserContext
        onLogin?.();
      } catch (error) {
        console.error('Error decoding token:', error);
        // Welcome notification is now handled by UserContext
        onLogin?.();
      }
    }
  };

  const handleGoogleLoginError = () => {
    console.error('Google Login Failed');
    toast.error('Failed to sign in with Google. Please try again.');
  };

  const handleLinkedInSignIn = async () => {
    if (!supabaseConfigured) {
      toast.error('Supabase credentials are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY and restart.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('LinkedIn Login Error:', error);
        toast.error(error.message || 'Failed to sign in with LinkedIn. Please try again.');
      }
    } catch (error) {
      console.error('LinkedIn Login Failed:', error);
      toast.error('Failed to sign in with LinkedIn. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center py-12 px-4">
      {/* Auth Form Section */}
      <section className="w-full">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              {!supabaseConfigured && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file, then restart the dev server to enable sign-in.
                </div>
              )}

              {/* Auth Card */}
              <div className="rounded-3xl bg-card p-8 shadow-lg sm:p-10 border border-border/50">
                {authError && (
                  <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {authError}
                  </div>
                )}

                {/* Logo and Brand */}
                <div className="mb-8 text-center">
                  <div className="gradient-lavender shadow-lavender mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-9 w-9"
                    >
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" fillOpacity="0.9" />
                      <path
                        d="M2 17L12 22L22 17"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2 12L12 17L22 12"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold mb-2 font-['Poppins'] text-gradient-lavender">Motif</h1>
                  <p className="text-sm text-muted-foreground">
                    {isLogin ? 'Welcome back! Sign in to continue' : 'Create your account to get started'}
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name - Only for Sign Up */}
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Enter your name"
                          value={formData.fullName}
                          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                          onBlur={() => handleBlur('fullName')}
                          className="h-12 rounded-xl pl-12"
                          aria-invalid={touched.fullName && !!errors.fullName}
                        />
                      </div>
                      {touched.fullName && errors.fullName && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1 text-sm text-destructive"
                        >
                          <AlertCircle className="h-4 w-4" />
                          <span>{errors.fullName}</span>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        onBlur={() => handleBlur('email')}
                        className="h-12 rounded-xl pl-12"
                        aria-invalid={touched.email && !!errors.email}
                      />
                    </div>
                    {touched.email && errors.email && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1 text-sm text-destructive"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.email}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        onBlur={() => handleBlur('password')}
                        className="h-12 rounded-xl pl-12 pr-12"
                        aria-invalid={touched.password && !!errors.password}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {touched.password && errors.password && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1 text-sm text-destructive"
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span>{errors.password}</span>
                      </motion.div>
                    )}
                    {!isLogin && !touched.password && (
                      <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters with uppercase, lowercase, and number
                      </p>
                    )}
                  </div>

                  {/* Remember Me */}
                  {isLogin && (
                    <div className="flex items-center gap-2 pt-1">
                      <Checkbox
                        id="rememberMe"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMeState(checked === true)}
                      />
                      <Label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer select-none">
                        Remember me for 30 days
                      </Label>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading || !supabaseConfigured}
                    className="gradient-lavender shadow-lavender h-12 w-full rounded-xl text-white font-semibold hover:opacity-90 transition-opacity mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Sign Up'}
                  </Button>
                </form>

                {/* Google Sign In - Only show if configured */}
                {import.meta.env.VITE_GOOGLE_CLIENT_ID &&
                 import.meta.env.VITE_GOOGLE_CLIENT_ID !== 'your_google_client_id_here' && (
                  <>
                    {/* Divider */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-card px-4 text-sm text-muted-foreground">
                          or
                        </span>
                      </div>
                    </div>

                    {/* Google Sign In */}
                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={handleGoogleLoginSuccess}
                        onError={handleGoogleLoginError}
                        disabled={!supabaseConfigured}
                        useOneTap
                        theme="outline"
                        size="large"
                        text={isLogin ? 'signin_with' : 'signup_with'}
                        width="100%"
                      />
                    </div>

                    {/* LinkedIn Sign In */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLinkedInSignIn}
                      disabled={!supabaseConfigured || isLoading}
                      className="w-full h-12 rounded-xl mt-3 flex items-center justify-center gap-2 hover:bg-[#0077B5]/10 border-[#0077B5]/30"
                    >
                      <Linkedin className="h-5 w-5 text-[#0077B5]" />
                      <span className="text-sm font-medium">
                        {isLogin ? 'Sign in with LinkedIn' : 'Sign up with LinkedIn'}
                      </span>
                    </Button>
                  </>
                )}

                {/* Toggle Login/Signup */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="font-semibold text-primary hover:underline"
                    >
                      {isLogin ? 'Sign Up' : 'Sign In'}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
