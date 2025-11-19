import { useState } from 'react';
import { motion } from 'motion/react';
import { Search } from 'lucide-react';

import { CaseCard, CaseCardProps } from '../CaseCard';
import { FilterChip } from '../FilterChip';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';

const mockCases: CaseCardProps[] = [
  {
    id: '1',
    company: 'TechFlow',
    logo: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop',
    title: 'Scaling User Acquisition on a Limited Budget',
    description:
      'A B2B SaaS startup needs to grow from 100 to 1000 users in 3 months with only $5k marketing budget.',
    difficulty: 'Medium',
    category: 'Marketing',
    attempts: 234,
  },
  {
    id: '2',
    company: 'GrowthStack',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
    title: 'Product-Market Fit Crisis',
    description:
      'An AI tool with great tech but no clear use case. Help find the right market segment.',
    difficulty: 'Hard',
    category: 'Product',
    attempts: 189,
  },
  {
    id: '3',
    company: 'MealPal',
    logo: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&h=100&fit=crop',
    title: 'Optimizing Food Delivery Operations',
    description: 'Reduce delivery time by 30% while maintaining quality and keeping costs low.',
    difficulty: 'Medium',
    category: 'Operations',
    attempts: 156,
  },
  {
    id: '4',
    company: 'StartupHub',
    logo: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=100&h=100&fit=crop',
    title: 'Building a Community from Zero',
    description: 'Launch a founder community and get to 500 active members in the first month.',
    difficulty: 'Easy',
    category: 'Growth',
    attempts: 312,
  },
  {
    id: '5',
    company: 'DataViz Pro',
    logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop',
    title: 'Pivot Strategy for Failing Product',
    description: 'A data visualization tool is losing users. Decide whether to pivot or persevere.',
    difficulty: 'Hard',
    category: 'Product',
    attempts: 98,
  },
  {
    id: '6',
    company: 'FitTrack',
    logo: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=100&h=100&fit=crop',
    title: 'Viral Marketing Campaign Design',
    description: 'Create a growth loop that turns every user into 3 new users organically.',
    difficulty: 'Medium',
    category: 'Marketing',
    attempts: 267,
  },
  {
    id: '7',
    company: 'CodeLearn',
    logo: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=100&h=100&fit=crop',
    title: 'Pricing Model Optimization',
    description: 'Find the optimal pricing tiers that maximize revenue without losing customers.',
    difficulty: 'Easy',
    category: 'Growth',
    attempts: 445,
  },
  {
    id: '8',
    company: 'CloudSync',
    logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&h=100&fit=crop',
    title: 'Enterprise Sales Strategy',
    description:
      "Break into enterprise market with a product built for SMBs. What's your approach?",
    difficulty: 'Hard',
    category: 'Growth',
    attempts: 123,
  },
];

interface CaseStudiesPageProps {
  onNavigate?: (page: string, caseId?: string) => void;
}

export function CaseStudiesPage({ onNavigate }: CaseStudiesPageProps) {
  const [difficulty, setDifficulty] = useState<string>('All');
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredCases = mockCases.filter(caseItem => {
    const matchesDifficulty = difficulty === 'All' || caseItem.difficulty === difficulty;
    const matchesCategory = category === 'all' || caseItem.category === category;
    const matchesSearch =
      caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDifficulty && matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-background min-h-screen">
      {/* Header Section */}
      <section className="via-background to-background border-border relative overflow-hidden border-b bg-gradient-to-br from-[#C9A7EB]/20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-gradient-lavender mb-4">Case Studies</h1>
            <p className="text-muted-foreground mx-auto max-w-2xl">
              Real challenges inspired by startups and tech leaders. Practice solving business
              problems and climb the leaderboard.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="outline" className="rounded-full">
                All Cases
              </Button>
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => onNavigate?.('attempts')}
              >
                Your Attempts
              </Button>
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => onNavigate?.('leaderboard')}
              >
                Leaderboard
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter Bar - Sticky */}
      <div className="bg-background/80 border-border sticky top-16 z-40 border-b backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Difficulty Chips */}
            <div className="flex flex-wrap gap-2">
              {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
                <FilterChip
                  key={diff}
                  label={diff}
                  isActive={difficulty === diff}
                  onClick={() => setDifficulty(diff)}
                />
              ))}
            </div>

            {/* Category & Sort */}
            <div className="ml-auto flex gap-2">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[140px] rounded-xl">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Growth">Growth</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] rounded-xl">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="attempts">Most Attempted</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>

              {/* Search */}
              <div className="relative">
                <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-[200px] rounded-xl pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Cards Grid */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {filteredCases.map((caseItem, index) => (
              <motion.div
                key={caseItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CaseCard {...caseItem} onClick={() => onNavigate?.('CaseDetail', caseItem.id)} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
