import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Search, Edit, BarChart3, Trash2, Filter } from 'lucide-react';
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
    toast.success('Redirecting to Idea Analyzer...');
    onNavigate?.('idea-analyzer');
  };

  const handleEdit = () => {
    toast.info('Opening editor...');
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
      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Filters & Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="text-muted-foreground h-5 w-5" />
                <Button
                  variant={sortBy === 'date' ? 'default' : 'outline'}
                  onClick={() => setSortBy('date')}
                  className="rounded-full"
                  size="sm"
                >
                  Sort by Date
                </Button>
                <Button
                  variant={sortBy === 'az' ? 'default' : 'outline'}
                  onClick={() => setSortBy('az')}
                  className="rounded-full"
                  size="sm"
                >
                  A–Z
                </Button>
                <Button
                  variant={sortBy === 'tags' ? 'default' : 'outline'}
                  onClick={() => setSortBy('tags')}
                  className="rounded-full"
                  size="sm"
                >
                  Tags
                </Button>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search your ideas..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="rounded-xl pl-10"
                />
              </div>
            </div>

            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <p>
                {filteredIdeas.length} {filteredIdeas.length === 1 ? 'idea' : 'ideas'} saved
              </p>
              <p>{filteredIdeas.filter(i => !i.shared).length} private</p>
            </div>
          </motion.div>

          {/* Ideas Grid */}
          {isLoading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <p className="text-muted-foreground text-xl">Loading your ideas...</p>
            </motion.div>
          ) : filteredIdeas.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <p className="text-muted-foreground mb-4 text-xl">
                {searchQuery ? 'No ideas match your search' : 'No saved ideas yet'}
              </p>
              <Button
                onClick={() => onNavigate?.('idea-analyzer')}
                className="gradient-lavender shadow-lavender rounded-xl hover:opacity-90"
              >
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
                >
                  <Card className="border-border/50 hover:border-primary/50 h-full transition-all hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="mb-3 flex items-start justify-between">
                        <h3 className="mb-2 line-clamp-2 flex-1">{idea.title}</h3>
                        {!idea.shared && (
                          <Badge variant="secondary" className="ml-2 rounded-full text-xs">
                            Private
                          </Badge>
                        )}
                      </div>

                      <p className="text-muted-foreground mb-4 line-clamp-3 text-sm">
                        {idea.description}
                      </p>

                      <div className="mb-4 flex flex-wrap gap-2">
                        {idea.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="rounded-full text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {idea.score && (
                        <div className="bg-primary/10 mb-4 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">Validation Score</span>
                            <span className="text-primary font-medium">{idea.score}/100</span>
                          </div>
                        </div>
                      )}

                      <div className="text-muted-foreground mb-4 text-xs">
                        Created {formatDate(idea.createdDate)}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit()}
                          className="flex-1 rounded-xl"
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleAnalyzeAgain()}
                          className="gradient-lavender flex-1 rounded-xl hover:opacity-90"
                        >
                          <BarChart3 className="mr-1 h-3 w-3" />
                          Analyze
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeleteId(idea.id)}
                          className="text-destructive hover:text-destructive rounded-xl"
                        >
                          <Trash2 className="h-3 w-3" />
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
