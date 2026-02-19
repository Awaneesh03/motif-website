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
    <Card className="bg-white dark:bg-card border border-border/50 hover:border-border hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Left: Upvote Section */}
          <button
            onClick={onUpvote}
            disabled={!canUpvote}
            title={canUpvote ? (hasUpvoted ? 'Remove upvote' : 'Upvote this idea') : 'Login to upvote'}
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] h-[56px] rounded-lg border transition-all ${
              hasUpvoted 
                ? 'bg-primary/10 border-primary/30 text-primary' 
                : 'bg-muted/30 border-transparent hover:bg-primary/5 hover:border-primary/20'
            } ${!canUpvote ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}`}
          >
            <ArrowUp
              className={`h-5 w-5 ${hasUpvoted ? 'text-primary' : 'text-muted-foreground'}`}
            />
            <span className={`text-sm font-bold ${hasUpvoted ? 'text-primary' : 'text-foreground'}`}>
              {upvotes}
            </span>
          </button>

          {/* Center: Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h4 className="text-sm font-semibold leading-snug line-clamp-1 text-foreground mb-1.5">
              {title}
            </h4>

            {/* Tags + Author Row */}
            <div className="flex items-center gap-2 flex-wrap">
              {tags.slice(0, 3).map(tag => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="rounded text-[11px] font-medium px-2 py-0.5 bg-muted/50 text-muted-foreground border-0 hover:bg-muted"
                >
                  {tag}
                </Badge>
              ))}
              <span className="text-muted-foreground/40 text-xs">•</span>
              <div className="flex items-center gap-1.5">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={authorAvatar} alt={author} />
                  <AvatarFallback className="text-[8px] bg-muted">{author[0]}</AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                  {author}
                </span>
              </div>
            </div>

            {/* Short Description */}
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-1 mt-1.5">
                {description}
              </p>
            )}
          </div>

          {/* Right: Comments */}
          <button
            onClick={onCommentClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            title="View Comments"
          >
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">{comments}</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
    </Card>
  );
}
