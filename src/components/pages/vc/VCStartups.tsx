import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Building2,
  Eye,
  Loader2,
  Search,
  Filter,
  TrendingUp,
  Target,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApprovedStartups, type Startup } from '@/lib/startupService';

const VCStartups = () => {
  const navigate = useNavigate();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [filteredStartups, setFilteredStartups] = useState<Startup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');

  useEffect(() => {
    loadStartups();
  }, []);

  useEffect(() => {
    filterStartups();
  }, [searchQuery, selectedStage, selectedIndustry, startups]);

  const loadStartups = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const approved = await getApprovedStartups();
      setStartups(approved);
      setFilteredStartups(approved);
    } catch (err) {
      console.error('Error loading startups:', err);
      setError('Failed to load startups. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const filterStartups = () => {
    let filtered = startups;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.pitch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.industry?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Stage filter
    if (selectedStage !== 'all') {
      filtered = filtered.filter((s) => s.stage === selectedStage);
    }

    // Industry filter
    if (selectedIndustry !== 'all') {
      filtered = filtered.filter((s) => s.industry === selectedIndustry);
    }

    setFilteredStartups(filtered);
  };

  // Extract unique stages and industries for filters
  const stages = ['all', ...Array.from(new Set(startups.map((s) => s.stage).filter(Boolean)))];
  const industries = ['all', ...Array.from(new Set(startups.map((s) => s.industry).filter(Boolean)))];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="via-background to-background border-border relative overflow-hidden border-b bg-gradient-to-br from-[#C9A7EB]/20 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold mb-2">Deal Flow</h1>
            <p className="text-muted-foreground">
              {filteredStartups.length} startup{filteredStartups.length !== 1 ? 's' : ''} available
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                    Error Loading Startups
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadStartups}
                  className="rounded-lg border-red-600 text-red-600 hover:bg-red-50"
                >
                  Retry
                </Button>
              </div>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-surface border-border/50 mb-6">
              <CardContent className="p-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search startups..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-xl"
                    />
                  </div>

                  {/* Stage Filter */}
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value)}
                      className="w-full pl-10 h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {stages.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage === 'all' ? 'All Stages' : stage}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Industry Filter */}
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      value={selectedIndustry}
                      onChange={(e) => setSelectedIndustry(e.target.value)}
                      className="w-full pl-10 h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {industries.map((industry) => (
                        <option key={industry} value={industry}>
                          {industry === 'all' ? 'All Industries' : industry}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Startups List */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
              <p>Loading startups...</p>
            </div>
          ) : filteredStartups.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Card className="glass-surface border-border/50">
                <CardContent className="p-12 text-center">
                  <Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No startups found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || selectedStage !== 'all' || selectedIndustry !== 'all'
                      ? 'Try adjusting your filters'
                      : 'Check back soon for new opportunities'}
                  </p>
                  {(searchQuery || selectedStage !== 'all' || selectedIndustry !== 'all') && (
                    <Button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedStage('all');
                        setSelectedIndustry('all');
                      }}
                      className="gradient-lavender rounded-xl"
                    >
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredStartups.map((startup, index) => (
                <motion.div
                  key={startup.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className="glass-surface border-border/50 hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group"
                    onClick={() => navigate(`/vc/startups/${startup.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                            {startup.name}
                          </h3>
                          <p className="text-foreground leading-relaxed mb-3">
                            {startup.pitch}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-0 whitespace-nowrap">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Motif Approved
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        {startup.industry && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium">Industry:</span>
                            <Badge variant="secondary" className="text-xs">
                              {startup.industry}
                            </Badge>
                          </div>
                        )}
                        {startup.stage && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Target className="h-4 w-4" />
                            <span className="font-medium">Stage:</span>
                            <Badge variant="secondary" className="text-xs">
                              {startup.stage}
                            </Badge>
                          </div>
                        )}
                        <div className="ml-auto">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="group-hover:bg-primary group-hover:text-white transition-colors rounded-lg"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default VCStartups;
