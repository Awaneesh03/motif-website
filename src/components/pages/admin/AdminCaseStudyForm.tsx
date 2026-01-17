import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Save, Eye, FileText, Target, Lightbulb, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/contexts/UserContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CaseStudyFormData {
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  problemStatement: string;
  background: string;
  constraints: string;
  expectedOutcome: string;
  hints: string;
  solution: string;
  tags: string[];
  status: 'Draft' | 'Published';
  imageUrl: string;
  category: string;
  company: string;
}

const AdminCaseStudyForm = () => {
  const { profile, isAdmin } = useUser();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState<CaseStudyFormData>({
    title: '',
    difficulty: 'Beginner',
    problemStatement: '',
    background: '',
    constraints: '',
    expectedOutcome: '',
    hints: '',
    solution: '',
    tags: [],
    status: 'Draft',
    imageUrl: '',
    category: 'General',
    company: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // HARD ROLE GUARD - Admin only
  useEffect(() => {
    if (profile && !isAdmin) {
      console.warn('[AdminCaseStudyForm] Unauthorized access attempt - redirecting');
      navigate('/dashboard', { replace: true });
    }
  }, [profile, isAdmin, navigate]);

  useEffect(() => {
    if (isEditing) {
      loadCaseStudy();
    }
  }, [id]);

  const loadCaseStudy = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('case_studies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Case study not found
          toast.error('Case study not found');
          navigate('/admin/case-studies');
          return;
        }
        throw error;
      }

      // Transform database data to form format
      const caseStudyData: CaseStudyFormData = {
        title: data.title || '',
        difficulty: data.difficulty || 'Beginner',
        problemStatement: data.problem_statement || '',
        background: data.background || '',
        constraints: data.constraints || '',
        expectedOutcome: data.expected_outcome || '',
        hints: data.hints || '',
        solution: data.solution || '',
        tags: data.tags || [],
        status: data.status || 'Draft',
        imageUrl: data.image_url || '',
        category: data.category || 'General',
        company: data.company || ''
      };

      setFormData(caseStudyData);
    } catch (error) {
      console.error('Error loading case study:', error);
      toast.error('Failed to load case study');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CaseStudyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.problemStatement.trim()) {
      toast.error('Problem statement is required');
      return;
    }

    setIsSaving(true);
    try {
      const dataToSave = {
        ...formData,
        status: publish ? 'Published' : formData.status
      };

      if (isEditing) {
        // Update in Supabase - transform form data to database format
        const dbData = {
          title: dataToSave.title,
          difficulty: dataToSave.difficulty,
          problem_statement: dataToSave.problemStatement,
          background: dataToSave.background,
          constraints: dataToSave.constraints,
          expected_outcome: dataToSave.expectedOutcome,
          hints: dataToSave.hints,
          solution: dataToSave.solution,
          tags: dataToSave.tags,
          status: dataToSave.status,
          image_url: dataToSave.imageUrl || null,
          category: dataToSave.category || 'General',
          company: dataToSave.company || null,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('case_studies')
          .update(dbData)
          .eq('id', id);

        if (error) throw error;
        toast.success('Case study updated successfully');
      } else {
        // Create in Supabase - transform form data to database format
        const dbData = {
          title: dataToSave.title,
          difficulty: dataToSave.difficulty,
          problem_statement: dataToSave.problemStatement,
          background: dataToSave.background,
          constraints: dataToSave.constraints,
          expected_outcome: dataToSave.expectedOutcome,
          hints: dataToSave.hints,
          solution: dataToSave.solution,
          tags: dataToSave.tags,
          status: dataToSave.status,
          image_url: dataToSave.imageUrl || null,
          category: dataToSave.category || 'General',
          company: dataToSave.company || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('case_studies')
          .insert([dbData]);

        if (error) throw error;
        toast.success('Case study created successfully');
      }

      navigate('/admin/case-studies');
    } catch (error) {
      console.error('Error saving case study:', error);
      toast.error('Failed to save case study');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="border-border border-b bg-background py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/case-studies')}
                  className="rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Case Studies
                </Button>
                <div>
                  <h1 className="text-xl font-bold">
                    {isEditing ? 'Edit Case Study' : 'Create Case Study'}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {isEditing ? 'Update the case study details' : 'Add a new learning resource for founders'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="rounded-xl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                  className="rounded-xl"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isSaving ? 'Publishing...' : 'Publish'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Form */}
      <section className="py-6">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="glass-surface border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter case study title"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="difficulty">Difficulty Level</Label>
                      <Select
                        value={formData.difficulty}
                        onValueChange={(value: 'Beginner' | 'Intermediate' | 'Advanced') =>
                          handleInputChange('difficulty', value)
                        }
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company/Source Name</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        placeholder="e.g., TechFlow, StartupHub"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleInputChange('category', value)}
                      >
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="General">General</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Product">Product</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Growth">Growth</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Strategy">Strategy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Cover Image URL</Label>
                    <Input
                      id="imageUrl"
                      value={formData.imageUrl}
                      onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste an image URL for the case study card. Recommended size: 100x100px
                    </p>
                    {formData.imageUrl && (
                      <div className="mt-2">
                        <img 
                          src={formData.imageUrl} 
                          alt="Preview" 
                          className="h-16 w-16 object-cover rounded-lg border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Add a tag and press Enter"
                        className="rounded-xl"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddTag}
                        className="rounded-xl"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Problem Statement */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="glass-surface border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Problem Statement *
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.problemStatement}
                    onChange={(e) => handleInputChange('problemStatement', e.target.value)}
                    placeholder="Describe the business problem or challenge..."
                    rows={4}
                    className="rounded-xl"
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Background & Context */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-surface border-border/50">
                <CardHeader>
                  <CardTitle>Background & Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.background}
                    onChange={(e) => handleInputChange('background', e.target.value)}
                    placeholder="Provide context about the situation, company, or industry..."
                    rows={4}
                    className="rounded-xl"
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Constraints */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass-surface border-border/50">
                <CardHeader>
                  <CardTitle>Constraints</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.constraints}
                    onChange={(e) => handleInputChange('constraints', e.target.value)}
                    placeholder="List budget, timeline, technical, or other constraints..."
                    rows={3}
                    className="rounded-xl"
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Expected Outcome */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="glass-surface border-border/50">
                <CardHeader>
                  <CardTitle>Expected Outcome</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.expectedOutcome}
                    onChange={(e) => handleInputChange('expectedOutcome', e.target.value)}
                    placeholder="What should be achieved by the end of this case study?"
                    rows={3}
                    className="rounded-xl"
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Hints */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="glass-surface border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Hints (Optional)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.hints}
                    onChange={(e) => handleInputChange('hints', e.target.value)}
                    placeholder="Provide helpful hints for learners working on this case study..."
                    rows={3}
                    className="rounded-xl"
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Solution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="glass-surface border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Solution (Hidden from Users)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.solution}
                    onChange={(e) => handleInputChange('solution', e.target.value)}
                    placeholder="Detailed solution and approach (only visible to admins)..."
                    rows={6}
                    className="rounded-xl"
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminCaseStudyForm;
