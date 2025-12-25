import { Badge } from './ui/badge';

interface DifficultyBadgeProps {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const colors = {
    Easy: 'bg-[#A9F5D0] text-[#0E1020]',
    Medium: 'bg-[#FFD19C] text-[#0E1020]',
    Hard: 'bg-[#FF7C7C] text-white',
  };

  return (
    <Badge className={`${colors[difficulty]} border-0 ${className || ''}`}>{difficulty}</Badge>
  );
}
