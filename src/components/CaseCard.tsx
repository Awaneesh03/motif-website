import { useState } from 'react';
import { motion } from 'motion/react';
import { Users } from 'lucide-react';

import { DifficultyBadge } from './DifficultyBadge';
import { Badge } from './ui/badge';

export interface CaseCardProps {
  id: string;
  company: string;
  /** Pre-resolved public URL (from caseStudyService), or null for no image. */
  logo?: string | null;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  attempts: number;
  onClick?: () => void;
}

/** Fallback shown when the image URL is absent or fails to load. */
function LogoFallback({ company }: { company: string }) {
  const initial = (company || '?').charAt(0).toUpperCase();
  return (
    <div
      className="h-12 w-12 flex-shrink-0 rounded-lg bg-primary/10 flex items-center justify-center font-semibold text-base text-primary/70 select-none"
      aria-label={`${company} logo placeholder`}
    >
      {initial}
    </div>
  );
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
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(logo) && !imgError;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4 }}
      className="glass-surface hover:shadow-lavender group cursor-pointer rounded-[16px] p-6 transition-all"
    >
      <div className="mb-4 flex gap-4">
        {showImage ? (
          <img
            src={logo!}
            alt={`${company} logo`}
            className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
            onError={() => {
              console.warn(`[CaseCard] Image failed to load for "${company}":`, logo);
              setImgError(true);
            }}
          />
        ) : (
          <LogoFallback company={company} />
        )}
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
