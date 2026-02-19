import { ArrowUp, MessageCircle } from 'lucide-react';

import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

interface IdeaCardProps {
  title: string;
  description?: string;
  upvotes: number;
  comments: number;
  tags: string[];
  author: string;
  authorAvatar?: string;
  onCommentClick?: () => void;
  onUpvote?: () => void;
  hasUpvoted?: boolean;
}

export function IdeaCard({
  title,
  description,
  upvotes,
  comments,
  tags,
  author,
  authorAvatar,
  onCommentClick,
  onUpvote,
  hasUpvoted,
}: IdeaCardProps) {
  const canUpvote = !!onUpvote;

  return (
    <Card className="bg-white dark:bg-card border border-border/60 shadow-sm">
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start gap-4 md:gap-5">
          {/* Left Zone: Vote */}
          <div className="flex flex-col items-center gap-1 min-w-[44px]">
            <button
              onClick={onUpvote}
              disabled={!canUpvote}
              title={canUpvote ? (hasUpvoted ? 'Remove upvote' : 'Upvote this idea') : 'Login to upvote'}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-2 transition-colors ${
                hasUpvoted 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-muted/50 hover:bg-muted'
              } ${!canUpvote ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <ArrowUp
                className={`h-4 w-4 ${hasUpvoted ? 'text-primary fill-primary' : 'text-muted-foreground'}`}
              />
              <span className={`text-xs font-semibold ${hasUpvoted ? 'text-primary' : 'text-foreground'}`}>
                {upvotes}
              </span>
            </button>
          </div>

          {/* Center Zone: Content */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Title */}
            <h4 className="text-base font-medium leading-snug line-clamp-2 text-foreground">
              {title}
            </h4>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 3).map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="rounded-md text-xs font-normal px-2.5 py-1 bg-muted/60 text-muted-foreground border-0"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Description (if present) */}
            {description && (
              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}

            {/* Author */}
            <div className="flex items-center gap-2 pt-1">
              <Avatar className="h-5 w-5">
                <AvatarImage src={authorAvatar} alt={author} />
                <AvatarFallback className="text-[10px] bg-muted">{author[0]}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {author}
              </span>
            </div>
          </div>

          {/* Right Zone: Comments */}
          <div className="flex flex-col items-center min-w-[44px]">
            <button
              onClick={onCommentClick}
              className="flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-2 bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              title="View Comments"
            >
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">{comments}</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
