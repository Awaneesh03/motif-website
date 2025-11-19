import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface AuthPageProps {
  onNavigate?: (page: string) => void;
  onLogin?: () => void;
}

interface ValidationErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

export function AuthPage({ onNavigate, onLogin }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

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

    // Handle form submission
    console.log('Form submitted:', formData);
    toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
    onLogin?.();
  };

  const handleGoogleLogin = () => {
    // Simulate Google login
    toast.success('Signed in with Google!');
    onLogin?.();
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
              {/* Auth Card */}
              <div className="rounded-3xl bg-card p-8 shadow-lg sm:p-10 border border-border/50">
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

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="gradient-lavender shadow-lavender h-12 w-full rounded-xl text-white font-semibold hover:opacity-90 transition-opacity mt-6"
                  >
                    {isLogin ? 'Sign In' : 'Sign Up'}
                  </Button>
                </form>

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
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full rounded-xl font-medium"
                  onClick={handleGoogleLogin}
                >
                  <svg className="mr-3 h-5 w-5 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </Button>

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
