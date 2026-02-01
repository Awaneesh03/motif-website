import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Target,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Checkbox } from '../../ui/checkbox';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { useUser } from '@/contexts/UserContext';
import { supabase, supabaseConfigured } from '@/lib/supabase';

// Industry options for preferences
const INDUSTRY_OPTIONS = [
  'Artificial Intelligence',
  'FinTech',
  'HealthTech',
  'EdTech',
  'E-commerce',
  'SaaS',
  'Climate Tech',
  'Blockchain/Web3',
  'Consumer',
  'Enterprise',
  'Logistics',
  'Real Estate',
  'Gaming',
  'Social Media',
  'Cybersecurity',
  'Other',
];

// Stage options
const STAGE_OPTIONS = [
  { value: 'pre-seed', label: 'Pre-Seed' },
  { value: 'seed', label: 'Seed' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B' },
  { value: 'growth', label: 'Growth' },
];

// Geography options
const GEOGRAPHY_OPTIONS = [
  'North America',
  'Europe',
  'Asia Pacific',
  'Latin America',
  'Middle East',
  'Africa',
  'Global',
];

const VCOnboarding = () => {
  const { profile } = useUser();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firm_name: '',
    investment_thesis: '',
    industries: [] as string[],
    stages: [] as string[],
    geographies: [] as string[],
    check_size_min: '',
    check_size_max: '',
  });

  const totalSteps = 4;

  const handleIndustryToggle = (industry: string) => {
    setFormData((prev) => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter((i) => i !== industry)
        : [...prev.industries, industry],
    }));
  };

  const handleStageToggle = (stage: string) => {
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.includes(stage)
        ? prev.stages.filter((s) => s !== stage)
        : [...prev.stages, stage],
    }));
  };

  const handleGeographyToggle = (geo: string) => {
    setFormData((prev) => ({
      ...prev,
      geographies: prev.geographies.includes(geo)
        ? prev.geographies.filter((g) => g !== geo)
        : [...prev.geographies, geo],
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!profile?.id) {
      toast.error('Profile not found. Please refresh and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (supabaseConfigured) {
        const { error } = await supabase
          .from('profiles')
          .update({
            firm_name: formData.firm_name,
            investment_thesis: formData.investment_thesis,
            industry_preferences: formData.industries,
            stage_preferences: formData.stages,
            geography_preferences: formData.geographies,
            check_size_min: formData.check_size_min ? parseInt(formData.check_size_min) : null,
            check_size_max: formData.check_size_max ? parseInt(formData.check_size_max) : null,
            onboarding_complete: true,
          })
          .eq('id', profile.id);

        if (error) throw error;
      } else {
        // Demo mode - just simulate success
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      toast.success('Onboarding complete! Welcome to the VC Portal.');
      // Refresh the page to update profile
      window.location.href = '/vc/dashboard';
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.firm_name.trim().length > 0;
      case 2:
        return formData.industries.length > 0;
      case 3:
        return formData.stages.length > 0;
      case 4:
        return true; // Optional step
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Step 1: Firm Info */}
          {currentStep === 1 && (
            <Card className="border-border/50">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Welcome to Motif VC Portal</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Let's set up your investment profile to match you with the best startups.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="firm_name">Firm / Fund Name</Label>
                  <Input
                    id="firm_name"
                    value={formData.firm_name}
                    onChange={(e) =>
                      setFormData({ ...formData, firm_name: e.target.value })
                    }
                    placeholder="e.g., Acme Ventures"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="thesis">Investment Thesis (Optional)</Label>
                  <Textarea
                    id="thesis"
                    value={formData.investment_thesis}
                    onChange={(e) =>
                      setFormData({ ...formData, investment_thesis: e.target.value })
                    }
                    placeholder="Describe your investment focus, thesis, or what makes your fund unique..."
                    className="mt-2 min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Industry Preferences */}
          {currentStep === 2 && (
            <Card className="border-border/50">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Industry Preferences</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Select the industries you're most interested in investing in.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <motion.div
                      key={industry}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <label
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          formData.industries.includes(industry)
                            ? 'border-primary bg-primary/10'
                            : 'border-border/50 hover:border-primary/50'
                        }`}
                      >
                        <Checkbox
                          checked={formData.industries.includes(industry)}
                          onCheckedChange={() => handleIndustryToggle(industry)}
                        />
                        <span className="text-sm">{industry}</span>
                      </label>
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Selected: {formData.industries.length} industries
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Stage Preferences */}
          {currentStep === 3 && (
            <Card className="border-border/50">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Stage Preferences</CardTitle>
                <p className="text-muted-foreground mt-2">
                  What startup stages do you typically invest in?
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {STAGE_OPTIONS.map((stage) => (
                    <motion.div
                      key={stage.value}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <label
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                          formData.stages.includes(stage.value)
                            ? 'border-primary bg-primary/10'
                            : 'border-border/50 hover:border-primary/50'
                        }`}
                      >
                        <Checkbox
                          checked={formData.stages.includes(stage.value)}
                          onCheckedChange={() => handleStageToggle(stage.value)}
                        />
                        <span className="font-medium">{stage.label}</span>
                      </label>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Geography & Check Size */}
          {currentStep === 4 && (
            <Card className="border-border/50">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">Geography & Investment Size</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Almost done! Select your geography preferences and typical check size.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="mb-3 block">Geographic Focus</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {GEOGRAPHY_OPTIONS.map((geo) => (
                      <motion.div
                        key={geo}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <label
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            formData.geographies.includes(geo)
                              ? 'border-primary bg-primary/10'
                              : 'border-border/50 hover:border-primary/50'
                          }`}
                        >
                          <Checkbox
                            checked={formData.geographies.includes(geo)}
                            onCheckedChange={() => handleGeographyToggle(geo)}
                          />
                          <span className="text-sm">{geo}</span>
                        </label>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="check_min">Min Check Size ($)</Label>
                    <Input
                      id="check_min"
                      type="number"
                      value={formData.check_size_min}
                      onChange={(e) =>
                        setFormData({ ...formData, check_size_min: e.target.value })
                      }
                      placeholder="e.g., 50000"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="check_max">Max Check Size ($)</Label>
                    <Input
                      id="check_max"
                      type="number"
                      value={formData.check_size_max}
                      onChange={(e) =>
                        setFormData({ ...formData, check_size_max: e.target.value })
                      }
                      placeholder="e.g., 500000"
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="rounded-xl"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="rounded-xl gradient-lavender text-white"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-xl gradient-lavender text-white"
            >
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>

        {/* Skip Link */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/vc/dashboard')}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default VCOnboarding;
