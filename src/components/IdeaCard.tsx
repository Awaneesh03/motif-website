import { ArrowUp, MessageCircle } from 'lucide-react';

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
    /* Card shell — explicit border so it's visible against white page bg */
    <div
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: 10,
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
      className="hover:shadow-md hover:border-gray-300"
    >
      <div style={{ padding: 16 }}>
        {/* 3-column layout: Left fixed | Center fill | Right fixed */}
        <div className="flex items-start gap-3">

          {/* ── Left: Upvote ── fixed 56 × 56, never shrinks */}
          <button
            onClick={onUpvote}
            disabled={!canUpvote}
            title={
              canUpvote
                ? hasUpvoted
                  ? 'Remove upvote'
                  : 'Upvote this idea'
                : 'Login to upvote'
            }
            className={`transition-transform ${
              !canUpvote ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'
            }`}
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              width: 56,
              height: 56,
              borderRadius: 8,
              border: hasUpvoted ? '1.5px solid #6366f1' : '1.5px solid #64748b',
              backgroundColor: hasUpvoted ? 'rgba(99,102,241,0.1)' : '#dde3ee',
            }}
          >
            <ArrowUp
              className="h-5 w-5"
              style={{ color: hasUpvoted ? '#6366f1' : '#334155' }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                lineHeight: 1,
                color: hasUpvoted ? '#6366f1' : '#1e293b',
              }}
            >
              {upvotes}
            </span>
          </button>

          {/* ── Center: Content ── flex-1 so it fills remaining space */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold leading-snug line-clamp-1 text-foreground mb-1.5">
              {title}
            </h4>

            {/* Tags + Author */}
            <div className="flex items-center gap-2 flex-wrap">
              {tags.slice(0, 3).map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="rounded text-[11px] font-medium px-2 py-0.5 bg-muted/50 text-muted-foreground border-0"
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

            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {/* ── Right: Comments ── same size/style as upvote for symmetry */}
          <button
            onClick={onCommentClick}
            title="View Comments"
            className="cursor-pointer transition-opacity hover:opacity-75"
            style={{
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              width: 56,
              height: 56,
              borderRadius: 8,
              border: '1.5px solid #64748b',
              backgroundColor: '#dde3ee',
            }}
          >
            <MessageCircle
              className="h-4 w-4"
              style={{ color: '#334155' }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                lineHeight: 1,
                color: '#1e293b',
              }}
            >
              {comments}
            </span>
          </button>

        </div>
      </div>
    </div>
  );
}
