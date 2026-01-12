import { Star } from 'lucide-react';

import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface TestimonialCardProps {
  name: string;
  role: string;
  image: string;
  quote: string;
  rating: number;
}

export function TestimonialCard({ name, role, image, quote, rating }: TestimonialCardProps) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-6">
        <div className="mb-4 flex gap-1">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-muted-foreground mb-6 italic">"{quote}"</p>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={image} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-muted-foreground text-sm">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
