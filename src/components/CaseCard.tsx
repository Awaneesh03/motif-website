import { motion } from 'motion/react';
import { Users } from 'lucide-react';

import { DifficultyBadge } from './DifficultyBadge';
import { Badge } from './ui/badge';

export interface CaseCardProps {
  id: string;
  company: string;
  logo: string;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  attempts: number;
  onClick?: () => void;
}

export function CaseCard({
  company,
  logo,
  title,
  description,
  difficulty,
  category,
  attempts,
  onClick,
}: CaseCardProps) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4 }}
      className="glass-surface hover:shadow-lavender group cursor-pointer rounded-[16px] p-6 transition-all"
    >
      <div className="mb-4 flex gap-4">
        <img src={logo} alt={company} className="h-12 w-12 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 truncate">{title}</h3>
          <p className="text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <DifficultyBadge difficulty={difficulty} />
        <Badge variant="outline" className="text-xs">
          {category}
        </Badge>
        <div className="text-muted-foreground ml-auto flex items-center gap-1 text-sm">
          <Users className="h-4 w-4" />
          <span>{attempts} attempts</span>
        </div>
      </div>
    </motion.div>
  );
}
