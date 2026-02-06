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
    <Card className="border-border/50 transition-all hover:shadow-md hover:border-border">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="flex flex-col items-center gap-0.5 pt-0.5">
            <button
              onClick={onUpvote}
              disabled={!canUpvote}
              title={canUpvote ? (hasUpvoted ? 'Remove upvote' : 'Upvote this idea') : 'Login and refresh to upvote'}
              className={`rounded-md p-1.5 transition-all ${
                hasUpvoted ? 'bg-primary/20 hover:bg-primary/30' : 'hover:bg-primary/10'
              } ${!canUpvote ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            >
              <ArrowUp
                className={`h-4 w-4 ${hasUpvoted ? 'text-primary fill-primary' : 'text-primary'}`}
              />
            </button>
            <span className="text-xs font-medium">{upvotes}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="hover:text-primary text-sm font-semibold mb-1.5 cursor-pointer transition-colors line-clamp-2">{title}</h4>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary" className="rounded-full text-xs px-2 py-0 h-5">
                  {tag}
                </Badge>
              ))}
            </div>
            {description && (
              <p className="mb-2.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={authorAvatar} alt={author} />
                  <AvatarFallback className="text-[10px]">{author[0]}</AvatarFallback>
                </Avatar>
                <span className="truncate max-w-[120px]">{author}</span>
              </div>
              <button
                onClick={onCommentClick}
                className="hover:text-primary group flex items-center gap-1 transition-colors"
                title="View Comments"
              >
                <MessageCircle className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                <span>{comments}</span>
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
