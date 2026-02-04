import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Rocket,
  Send,
  CheckCircle2,
  ArrowLeft,
  AlertCircle,
  Sparkles,
  Building2,
  TrendingUp,
  Target,
  Lightbulb,
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { createStartup } from '@/lib/startupService';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';

const SubmitStartupPage = () => {
  const { profile } = useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    pitch: '',
    problem: '',
    solution: '',
    industry: '',
    stage: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [submittedStartup, setSubmittedStartup] = useState<any>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Async action for submitting startup
  const { loading: submitLoading, execute: executeSubmit } = useAsyncAction(
    async () => {
      if (!profile) {
        throw new Error('User profile not found');
      }

      // Create startup
      const newStartup = await createStartup({
        ...formData,
        status: 'pending_review',
        createdBy: profile.id,
        founderName: profile.name,
      });

      if (!newStartup) {
        throw new Error('Failed to create startup');
      }

      setSubmittedStartup(newStartup);
      setSubmitted(true);
    },
    {
      successMessage: 'Startup submitted successfully!',
      errorMessage: 'Failed to submit startup',
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeSubmit();
  };

  const isFormValid =
    formData.name &&
    formData.pitch &&
    formData.problem &&
    formData.solution &&
    formData.industry &&
    formData.stage;

  // Show confirmation screen after submission
  if (submitted && submittedStartup) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="via-background to-background border-border relative overflow-hidden border-b bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-800/20 py-8">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center mb-2">Startup Submitted!</h1>
              <p className="text-center text-muted-foreground">
                Your startup is under review by the Motif team
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-surface border-border/50 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-800/10">
                <CardContent className="p-8">
                  {/* Success Message */}
                  <div className="mb-6 text-center">
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-0 mb-4">
                      Under Review
                    </Badge>
                    <p className="text-muted-foreground text-sm">
                      You'll be notified once your startup has been reviewed. This typically takes 1-2 business days.
                    </p>
                  </div>

                  {/* Startup Details */}
                  <div className="border-t border-border pt-6 space-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Rocket className="h-4 w-4" />
                        Startup Name
                      </p>
                      <p className="font-semibold text-lg">{submittedStartup.name}</p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        One-Line Pitch
                      </p>
                      <p className="text-foreground">{submittedStartup.pitch}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Industry
                        </p>
                        <Badge variant="secondary">{submittedStartup.industry}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Stage
                        </p>
                        <Badge variant="secondary">{submittedStartup.stage}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* What Happens Next */}
                  <div className="mt-8 pt-6 border-t border-border">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      What Happens Next?
                    </h4>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                      <li>Our team reviews your submission for quality and completeness</li>
                      <li>You'll receive a notification with the review outcome</li>
                      <li>If approved, your startup becomes visible to VCs on the platform</li>
                      <li>VCs can request introductions to connect with you</li>
                    </ol>
                  </div>

                  {/* Back to Dashboard Button */}
                  <div className="mt-8 pt-6 border-t border-border">
                    <Button
                      onClick={() => navigate('/dashboard')}
                      className="w-full gradient-lavender shadow-lavender rounded-xl"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Dashboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  // Show submission form
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="via-background to-background border-border relative overflow-hidden border-b bg-gradient-to-br from-[#C9A7EB]/20 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold mb-2">Submit Your Startup</h1>
            <p className="text-muted-foreground">
              Complete this form to submit your startup for review. Once approved, your startup will be visible to investors.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <form onSubmit={handleSubmit}>
              <Card className="glass-surface border-border/50">
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Startup Name */}
                    <div>
                      <Label htmlFor="name" className="text-base font-semibold mb-3 flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-primary" />
                        Startup Name
                      </Label>
                      <Input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., CloudSync Pro"
                        className="rounded-xl"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Choose a memorable name for your startup
                      </p>
                    </div>

                    {/* One-Line Pitch */}
                    <div>
                      <Label htmlFor="pitch" className="text-base font-semibold mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        One-Line Pitch
                      </Label>
                      <Input
                        type="text"
                        id="pitch"
                        name="pitch"
                        value={formData.pitch}
                        onChange={handleChange}
                        placeholder="Describe your startup in one compelling sentence"
                        className="rounded-xl"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        This is the first thing investors will see
                      </p>
                    </div>

                    {/* Problem Statement */}
                    <div>
                      <Label htmlFor="problem" className="text-base font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        Problem Statement
                      </Label>
                      <textarea
                        id="problem"
                        name="problem"
                        value={formData.problem}
                        onChange={handleChange}
                        rows={4}
                        placeholder="What problem are you solving? Who experiences this problem?"
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Be specific about the pain point you're addressing
                      </p>
                    </div>

                    {/* Solution Overview */}
                    <div>
                      <Label htmlFor="solution" className="text-base font-semibold mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        Solution Overview
                      </Label>
                      <textarea
                        id="solution"
                        name="solution"
                        value={formData.solution}
                        onChange={handleChange}
                        rows={4}
                        placeholder="How does your solution work? What makes it unique?"
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Explain your approach and key differentiators
                      </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Industry */}
                      <div>
                        <Label htmlFor="industry" className="text-base font-semibold mb-3 flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          Industry
                        </Label>
                        <select
                          id="industry"
                          name="industry"
                          value={formData.industry}
                          onChange={handleChange}
                          className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        >
                          <option value="">Select industry</option>
                          <option value="SaaS">SaaS</option>
                          <option value="FinTech">FinTech</option>
                          <option value="HealthTech">HealthTech</option>
                          <option value="EdTech">EdTech</option>
                          <option value="CleanTech">CleanTech</option>
                          <option value="E-commerce">E-commerce</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Stage */}
                      <div>
                        <Label htmlFor="stage" className="text-base font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          Stage
                        </Label>
                        <select
                          id="stage"
                          name="stage"
                          value={formData.stage}
                          onChange={handleChange}
                          className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          required
                        >
                          <option value="">Select stage</option>
                          <option value="Idea">Idea</option>
                          <option value="Pre-seed">Pre-seed</option>
                          <option value="Seed">Seed</option>
                          <option value="Series A">Series A</option>
                          <option value="Series B">Series B</option>
                        </select>
                      </div>
                    </div>

                    {/* Help Text */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1 text-sm">
                            Submission Tips
                          </h4>
                          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                            <li>Be clear and concise in your descriptions</li>
                            <li>Focus on the unique value you provide</li>
                            <li>Review your submission before clicking submit</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={!isFormValid || submitLoading}
                        className="w-full gradient-lavender shadow-lavender rounded-xl h-12 text-base"
                      >
                        {submitLoading ? (
                          <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Submitting...
                          </span>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            Submit for Review
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default SubmitStartupPage;
