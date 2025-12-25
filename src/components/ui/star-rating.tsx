import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from './utils';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  className?: string;
}

export function StarRating({ 
  rating, 
  onRatingChange, 
  maxRating = 5, 
  size = 'md',
  readonly = false,
  className 
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const handleClick = (value: number) => {
    if (readonly) return;
    console.log('Star clicked:', value); // Debug log
    onRatingChange?.(value);
  };

  const handleMouseEnter = (value: number) => {
    if (readonly) return;
    console.log('Star hovered:', value); // Debug log
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    console.log('Mouse left stars'); // Debug log
    setHoverRating(0);
  };

  console.log('StarRating render:', { rating, hoverRating, readonly }); // Debug log

  return (
    <div 
      className={cn(
        'flex gap-1',
        !readonly && 'cursor-pointer',
        className
      )}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isHovered = hoverRating >= starValue;
        const isRated = rating >= starValue;
        // When clicked, immediately show as filled even during hover
        const shouldBeFilled = isRated || isHovered;
        
        return (
          <Star
            key={starValue}
            className={cn(
              sizeClasses[size],
              'transition-all duration-200 cursor-pointer',
              shouldBeFilled
                ? isRated
                  ? 'fill-yellow-500 text-yellow-500' // Selected color (priority)
                  : 'fill-orange-400 text-orange-400' // Hover color
                : 'fill-transparent text-gray-400 hover:text-gray-500'
            )}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
          />
        );
      })}
      <span className="ml-2 text-xs text-gray-500">
        {hoverRating > 0 ? `${hoverRating} stars` : rating > 0 ? `${rating} stars` : 'No rating'}
      </span>
    </div>
  );
}