import { motion } from 'motion/react';
import { useState } from 'react';
import { Mail, MessageSquare, Twitter, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  message?: string;
}

export function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validateName = (name: string): string | undefined => {
    if (!name) return 'Name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return undefined;
  };

  const validateMessage = (message: string): string | undefined => {
    if (!message) return 'Message is required';
    if (message.trim().length < 10) return 'Message must be at least 10 characters';
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    const nameError = validateName(formData.name);
    if (nameError) newErrors.name = nameError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const messageError = validateMessage(formData.message);
    if (messageError) newErrors.message = messageError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched({ ...touched, [field]: true });

    const newErrors = { ...errors };

    if (field === 'name') {
      const error = validateName(formData.name);
      if (error) {
        newErrors.name = error;
      } else {
        delete newErrors.name;
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

    if (field === 'message') {
      const error = validateMessage(formData.message);
      if (error) {
        newErrors.message = error;
      } else {
        delete newErrors.message;
      }
    }

    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      name: true,
      email: true,
      message: true,
    });

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      const { error } = await supabase.from('contact_submissions').insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      });
      if (error) throw error;

      setSubmitted(true);
      setFormData({ name: '', email: '', message: '' });
      setErrors({});
      setTouched({});
      toast.success('Message sent successfully!');
    } catch (error) {
      console.error('Failed to submit contact form:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="gradient-lavender relative overflow-hidden py-20">
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mb-6 font-['Poppins'] text-4xl text-white md:text-5xl">Get in Touch</h1>
            <p className="mx-auto max-w-2xl text-xl text-white/90">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as
              soon as possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="border-border/50 shadow-xl">
                <CardContent className="p-8">
                  {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Your name"
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          onBlur={() => handleBlur('name')}
                          className="rounded-xl"
                          aria-invalid={touched.name && !!errors.name}
                        />
                        {touched.name && errors.name && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-1 text-sm text-destructive"
                          >
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.name}</span>
                          </motion.div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          onBlur={() => handleBlur('email')}
                          className="rounded-xl"
                          aria-invalid={touched.email && !!errors.email}
                        />
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
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          placeholder="Tell us what's on your mind..."
                          rows={6}
                          value={formData.message}
                          onChange={e => setFormData({ ...formData, message: e.target.value })}
                          onBlur={() => handleBlur('message')}
                          className="rounded-xl"
                          aria-invalid={touched.message && !!errors.message}
                        />
                        {touched.message && errors.message && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-1 text-sm text-destructive"
                          >
                            <AlertCircle className="h-4 w-4" />
                            <span>{errors.message}</span>
                          </motion.div>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="gradient-lavender shadow-lavender h-12 w-full rounded-[16px] hover:opacity-90"
                      >
                        Send Message
                      </Button>
                    </form>
                  ) : (
                    <div className="py-12 text-center">
                      <div className="from-primary/10 to-secondary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br">
                        <Mail className="text-primary h-8 w-8" />
                      </div>
                      <h3 className="mb-2">Thank you for reaching out!</h3>
                      <p className="text-muted-foreground mb-6">
                        We've received your message and will get back to you within 24 hours.
                      </p>
                      <Button
                        onClick={() => setSubmitted(false)}
                        variant="outline"
                        className="rounded-full"
                      >
                        Send Another Message
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div>
                <h2 className="mb-6">Other Ways to Connect</h2>
                <p className="text-muted-foreground mb-8">
                  Prefer to reach out directly? We're active on multiple channels and always happy
                  to chat.
                </p>
              </div>

              <div className="space-y-4">
                <Card className="border-border/50 transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="from-primary/10 to-secondary/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br">
                        <Mail className="text-primary h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="mb-1">Email</h4>
                        <p className="text-muted-foreground mb-2">
                          For general inquiries and support
                        </p>
                        <a
                          href="mailto:hello@motif.com"
                          className="text-primary hover:underline"
                        >
                          hello@motif.com
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="from-primary/10 to-secondary/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br">
                        <MessageSquare className="text-primary h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="mb-1">Discord Community</h4>
                        <p className="text-muted-foreground mb-2">
                          Join our active founder community
                        </p>
                        <a href="#" className="text-primary hover:underline">
                          discord.gg/motif
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/50 transition-shadow hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="from-primary/10 to-secondary/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br">
                        <Twitter className="text-primary h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="mb-1">Twitter</h4>
                        <p className="text-muted-foreground mb-2">Follow us for updates and tips</p>
                        <a href="#" className="text-primary hover:underline">
                          @motif
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-muted/50 rounded-2xl p-6">
                <h4 className="mb-3">Office Hours</h4>
                <p className="text-muted-foreground mb-2">Monday - Friday: 9:00 AM - 6:00 PM PST</p>
                <p className="text-muted-foreground">
                  We typically respond within 24 hours on business days.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
