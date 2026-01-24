import { useState } from 'react';
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
  return (
    <Card className="border-border/50 transition-shadow hover:shadow-lg">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={onUpvote}
              className={`hover:bg-primary/10 rounded-lg p-2 transition-all ${
                hasUpvoted ? 'bg-primary/20' : ''
              }`}
            >
              <ArrowUp
                className={`h-5 w-5 ${hasUpvoted ? 'text-primary fill-primary' : 'text-primary'}`}
              />
            </button>
            <span className="text-sm">{upvotes}</span>
          </div>
          <div className="flex-1">
            <h4 className="hover:text-primary mb-2 cursor-pointer transition-colors">{title}</h4>
            <div className="mb-3 flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="rounded-full">
                  {tag}
                </Badge>
              ))}
            </div>
            {description && (
              <p className="mb-3 line-clamp-2 text-sm leading-[22px] text-[#B0B3C3] md:line-clamp-3">
                {description}
              </p>
            )}
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={authorAvatar} alt={author} />
                  <AvatarFallback>{author[0]}</AvatarFallback>
                </Avatar>
                <span>by {author}</span>
              </div>
              <button
                onClick={onCommentClick}
                className="hover:text-primary group flex items-center gap-1 transition-colors"
                title="View Comments"
              >
                <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span>{comments}</span>
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
