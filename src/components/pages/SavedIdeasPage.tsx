import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Search, BarChart3, Trash2, Filter, Lightbulb, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../contexts/UserContext';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface SavedIdea {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdDate: string;
  score?: number;
  shared: boolean;
}

interface SavedIdeasPageProps {
  onNavigate?: (page: string) => void;
}

export function SavedIdeasPage({ onNavigate }: SavedIdeasPageProps) {
  const { user } = useUser();
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'az' | 'tags'>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Load ideas from database
  useEffect(() => {
    if (user) {
      loadIdeas();
    } else {
      setIdeas([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadIdeas = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('idea_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading ideas:', error);
        toast.error('Failed to load your ideas');
        setIdeas([]);
      } else {
        // Transform database data to match SavedIdea interface
        const transformedIdeas: SavedIdea[] = (data || []).map(analysis => ({
          id: analysis.id,
          title: analysis.idea_title,
          description: analysis.idea_description,
          tags: [], // Tags can be added later if needed
          createdDate: analysis.created_at,
          score: analysis.score,
          shared: false, // Default to private
        }));
        setIdeas(transformedIdeas);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load your ideas');
      setIdeas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('idea_analyses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting idea:', error);
        toast.error('Failed to delete idea');
      } else {
        setIdeas(ideas.filter(idea => idea.id !== id));
        setDeleteId(null);
        toast.success('Idea deleted successfully');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete idea');
    }
  };

  const handleAnalyzeAgain = () => {
    toast.success('Redirecting to Idea Analyser...');
    onNavigate?.('Idea Analyser');
  };

  // Sort ideas
  const sortedIdeas = [...ideas].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
    } else if (sortBy === 'az') {
      return a.title.localeCompare(b.title);
    } else {
      return a.tags[0]?.localeCompare(b.tags[0] || '') || 0;
    }
  });

  // Filter by search
  const filteredIdeas = sortedIdeas.filter(
    idea =>
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <section className="gradient-lavender relative overflow-hidden py-16">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mb-4 font-['Poppins'] text-4xl text-white md:text-5xl">
              My Ideas Vault
            </h1>
            <p className="max-w-2xl text-xl text-white/80">
              All your generated and saved ideas in one place
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-background relative min-h-[80vh] py-12">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -right-[10%] bottom-[20%] h-[500px] w-[500px] rounded-full bg-purple-500/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Filters & Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10"
          >
            <div className="glass-card mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border/50 p-4 md:flex-row md:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Filter className="h-4 w-4" />
                </div>
                <div className="h-6 w-px bg-border/50 mx-2" />
                <Button
                  variant={sortBy === 'date' ? 'secondary' : 'ghost'}
                  onClick={() => setSortBy('date')}
                  className="rounded-full text-sm font-medium transition-all"
                  size="sm"
                >
                  Newest First
                </Button>
                <Button
                  variant={sortBy === 'az' ? 'secondary' : 'ghost'}
                  onClick={() => setSortBy('az')}
                  className="rounded-full text-sm font-medium transition-all"
                  size="sm"
                >
                  A–Z
                </Button>
                <Button
                  variant={sortBy === 'tags' ? 'secondary' : 'ghost'}
                  onClick={() => setSortBy('tags')}
                  className="rounded-full text-sm font-medium transition-all"
                  size="sm"
                >
                  Tags
                </Button>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search your vault..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-10 rounded-xl border-border/50 bg-background/50 pl-10 focus:bg-background transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <p className="text-muted-foreground text-sm font-medium">
                Showing {filteredIdeas.length} {filteredIdeas.length === 1 ? 'idea' : 'ideas'}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                {filteredIdeas.filter(i => !i.shared).length} Private
              </div>
            </div>
          </motion.div>

          {/* Ideas Grid */}
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-64 items-center justify-center"
            >
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium">Unlocking your vault...</p>
              </div>
            </motion.div>
          ) : filteredIdeas.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/10 to-purple-500/10 shadow-xl shadow-primary/5">
                <Lightbulb className="h-12 w-12 text-primary/80" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-foreground">
                {searchQuery ? 'No ideas found' : 'Your vault is empty'}
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md text-lg">
                {searchQuery
                  ? "We couldn't find any ideas matching your search. Try different keywords."
                  : "Every great unicorn started as a simple idea. Ready to find yours?"}
              </p>
              <Button
                onClick={() => onNavigate?.('Idea Analyser')}
                size="lg"
                className="gradient-lavender shadow-lavender h-12 rounded-xl px-8 text-base font-semibold transition-transform hover:scale-105 active:scale-95"
              >
                <span className="mr-2 text-xl">✨</span>
                Generate Your First Idea
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredIdeas.map((idea, index) => (
                <motion.div
                  key={idea.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  layout
                >
                  <Card className="group relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5">
                    {/* Gradient Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <CardContent className="relative flex h-full flex-col p-6">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="line-clamp-2 text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
                            {idea.title}
                          </h3>
                        </div>
                        {!idea.shared && (
                          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-background/80 shadow-sm ring-1 ring-border/50" title="Private Idea">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                          </div>
                        )}
                      </div>

                      <p className="text-muted-foreground mb-6 line-clamp-3 flex-1 text-sm leading-relaxed">
                        {idea.description}
                      </p>

                      <div className="mb-6 flex flex-wrap gap-2">
                        {idea.tags.length > 0 ? (
                          idea.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="bg-secondary/50 font-normal text-xs hover:bg-secondary">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="secondary" className="bg-secondary/30 text-muted-foreground font-normal text-xs">
                            No tags
                          </Badge>
                        )}
                        {idea.tags.length > 3 && (
                          <Badge variant="secondary" className="bg-secondary/30 text-xs">
                            +{idea.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-auto space-y-4">
                        {idea.score && (
                          <div className="flex items-center justify-between rounded-xl bg-secondary/30 p-3 ring-1 ring-border/50">
                            <span className="text-xs font-medium text-muted-foreground">Viability Score</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-sm font-bold ${idea.score >= 80 ? 'text-green-600' :
                                idea.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                {idea.score}
                              </span>
                              <span className="text-xs text-muted-foreground">/100</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2 pt-2">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                            {formatDate(idea.createdDate)}
                          </span>

                          <div className="flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(idea.id)}
                              className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                              title="Delete Idea"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleAnalyzeAgain()}
                          className="w-full rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-medium transition-all duration-300"
                        >
                          <BarChart3 className="mr-2 h-4 w-4" />
                          View Analysis
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Idea?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your saved idea.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="gradient-lavender shadow-lavender rounded-xl hover:opacity-90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
