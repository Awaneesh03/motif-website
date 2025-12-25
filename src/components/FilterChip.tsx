import { motion } from 'motion/react';

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export function FilterChip({ label, isActive, onClick }: FilterChipProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`rounded-full px-4 py-2 transition-all ${
        isActive
          ? 'gradient-lavender shadow-lavender text-white'
          : 'bg-muted/50 text-foreground hover:bg-muted'
      }`}
    >
      {label}
    </motion.button>
  );
}
