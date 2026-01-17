import { Badge } from './ui/badge';

interface DifficultyBadgeProps {
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Beginner' | 'Intermediate' | 'Advanced';
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  // Normalize difficulty to display value
  const normalizedDifficulty = (() => {
    switch (difficulty) {
      case 'Beginner':
      case 'Easy':
        return 'Easy';
      case 'Intermediate':
      case 'Medium':
        return 'Medium';
      case 'Advanced':
      case 'Hard':
        return 'Hard';
      default:
        return 'Medium';
    }
  })();

  const colors = {
    Easy: 'bg-[#A9F5D0] text-[#0E1020]',
    Medium: 'bg-[#FFD19C] text-[#0E1020]',
    Hard: 'bg-[#FF7C7C] text-white',
  };

  return (
    <Badge className={`${colors[normalizedDifficulty]} border-0 ${className || ''}`}>{normalizedDifficulty}</Badge>
  );
}
