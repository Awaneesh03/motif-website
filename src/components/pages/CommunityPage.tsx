import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { TrendingUp, Clock, MessageCircle, Award, Send, Lightbulb, Loader2, Sparkles, MessageSquare, Filter, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../ui/button';
import { IdeaCard } from '../IdeaCard';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../lib/supabase';

const COMMUNITY_STORAGE_KEY = 'motif-community-ideas';
const COMMUNITY_COMMENTS_KEY = 'motif-community-comments';

interface CommunityIdea {
  id?: string;
  title: string;
  description: string;
  upvotes: number;
  comments: number;
  tags: string[];
  author: string;
  authorAvatar?: string;
  createdAt?: string;
  /** ISO timestamp from the DB row — used to guard against stale refetch overwrites */
  updatedAt?: string;
  hasUpvoted?: boolean;
  authorId?: string;
}

interface CommunityComment {
  id: string;
  author: string;
  avatar?: string;
  message: string;
  timestamp: string;
}

interface AnalyzedIdea {
  id: string;
  idea_title: string;
  idea_description: string;
  score?: number;
  created_at: string;
  target_market?: string;
}

const seedIdeas: CommunityIdea[] = [
  {
    title: 'AI-powered meal planning app for busy professionals',
    description:
      'An AI-powered assistant that helps users manage daily meal planning using predictive nutrition analysis and personalized recipes based on dietary preferences.',
    upvotes: 234,
    comments: 45,
    tags: ['AI', 'HealthTech', 'Mobile'],
    author: 'Alex Kim',
    authorAvatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
  },
  {
    title: 'Blockchain-based freelancer marketplace with escrow',
    description:
      'A decentralized platform connecting freelancers with clients, featuring smart contract escrow payments and reputation tracking on-chain.',
    upvotes: 189,
    comments: 32,
    tags: ['Web3', 'Marketplace', 'Fintech'],
    author: 'Jordan Lee',
    authorAvatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
  },
  {
    title: 'No-code platform for building internal tools',
    description:
      'Empower non-technical teams to build custom internal tools and workflows without writing code, integrating with existing business systems.',
    upvotes: 156,
    comments: 28,
    tags: ['SaaS', 'No-Code', 'B2B'],
    author: 'Sam Patel',
    authorAvatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  },
  {
    title: 'Virtual reality training platform for medical students',
    description:
      'Immersive VR simulations for medical procedures and diagnostics, providing hands-on practice in a safe, controlled environment.',
    upvotes: 142,
    comments: 24,
    tags: ['VR', 'EdTech', 'Healthcare'],
    author: 'Maya Rodriguez',
    authorAvatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  },
  {
    title: 'Sustainable packaging marketplace for e-commerce',
    description:
      'Connect e-commerce brands with eco-friendly packaging suppliers, featuring carbon footprint tracking and bulk ordering options.',
    upvotes: 128,
    comments: 19,
    tags: ['Sustainability', 'E-commerce', 'B2B'],
    author: 'Chen Wei',
    authorAvatar:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
  },
  {
    title: 'AI writing assistant for technical documentation',
    description:
      'Automated documentation generator for software projects, creating clear technical docs from code comments and API structures.',
    upvotes: 115,
    comments: 16,
    tags: ['AI', 'SaaS', 'Developer Tools'],
    author: 'Emily Davis',
    authorAvatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
  },
  {
    title: 'Smart parking solution for urban areas',
    description:
      'IoT-enabled parking system with real-time availability tracking, mobile reservations, and dynamic pricing for city parking management.',
    upvotes: 98,
    comments: 14,
    tags: ['IoT', 'Smart City', 'Mobile'],
    author: 'David Chen',
    authorAvatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
  },
  {
    title: 'Mental health chatbot for college students',
    description:
      'AI-powered conversational support providing 24/7 mental health resources, coping strategies, and crisis intervention for students.',
    upvotes: 87,
    comments: 12,
    tags: ['AI', 'HealthTech', 'EdTech'],
    author: 'Sarah Miller',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
  },
  {
    title: 'Subscription box for sustainable pet products',
    description:
      "Monthly curated boxes of eco-friendly pet supplies, toys, and treats tailored to your pet's needs with zero-waste packaging.",
    upvotes: 76,
    comments: 10,
    tags: ['E-commerce', 'Sustainability', 'Pets'],
    author: 'Michael Brown',
    authorAvatar:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop',
  },
  {
    title: 'Voice-controlled home automation for elderly',
    description:
      'Simple voice interface for smart home control designed specifically for seniors, featuring emergency alerts and medication reminders.',
    upvotes: 65,
    comments: 8,
    tags: ['IoT', 'HealthTech', 'Accessibility'],
    author: 'Lisa Wang',
    authorAvatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
  },
  {
    title: 'Decentralized music streaming platform',
    description:
      'Web3 music platform where artists earn directly from streams using blockchain, with NFT album releases and fan governance.',
    upvotes: 54,
    comments: 7,
    tags: ['Web3', 'Music', 'Entertainment'],
    author: 'Tom Anderson',
    authorAvatar:
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
  },
  {
    title: 'AI-powered code review tool',
    description:
      'Intelligent code analysis tool that provides automated security checks, style suggestions, and performance optimizations.',
    upvotes: 43,
    comments: 5,
    tags: ['AI', 'Developer Tools', 'SaaS'],
    author: 'Priya Sharma',
    authorAvatar:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
  },
];

const leaderboard = [
  { name: 'Alex Kim', points: 2847, ideas: 12 },
  { name: 'Jordan Lee', points: 2156, ideas: 8 },
  { name: 'Sam Patel', points: 1923, ideas: 15 },
  { name: 'Maya Rodriguez', points: 1654, ideas: 7 },
  { name: 'Chen Wei', points: 1432, ideas: 9 },
];

interface CommunityPageProps {
  onNavigate?: (page: string) => void;
}

interface LogContext {
  userId?: string | null;
  ideaTitle?: string;
  /** Sanitized payload — never include PII beyond what's already public */
  payload?: Record<string, unknown>;
  durationMs?: number;
  /** Unique per-submission ID for correlating logs, optimistic entry, and DB row */
  requestId?: string;
  /** Stable UUID for this browser tab — survives re-renders, cleared on close */
  tabId?: string;
  /** Logical route that triggered the action, e.g. 'community/post-idea' */
  route?: string;
  /** How many times this submission has been attempted in the current dialog session */
  attempt?: number;
  /** Feature area — always 'community-post' for submissions in this file */
  feature?: string;
  /** Lifecycle phase within the feature, e.g. 'insert', 'read-after-write', 'rollback' */
  phase?: string;
  /** Unique ID for this specific log event — distinct from requestId (one request, many events) */
  eventId?: string;
  /** Pre-computed latency bucket — omit here, logError computes it from durationMs */
  latencyBucket?: never;
}

const logError = (action: string, error: any, ctx?: LogContext) => {
  const { latencyBucket: _omit, ...rest } = ctx ?? {};
  console.error('[IdeaForge:Community]', {
    seq: nextSeq(),
    action,
    code: error?.code ?? null,
    message: error?.message ?? String(error),
    hint: error?.hint ?? null,
    details: error?.details ?? null,
    ...rest,
    ...(rest.durationMs !== undefined ? { latencyBucket: latencyBucket(rest.durationMs) } : {}),
    timestamp: new Date().toISOString(),
  });
  // Sentry integration point:
  // window.__sentry?.captureException?.(error, { extra: { action, ...ctx } });
};

/**
 * Races a promise against a timeout. Throws an error with code='TIMEOUT' if
 * the promise does not settle within `ms` milliseconds.
 * Note: the underlying request is NOT cancelled (AbortSignal can be layered
 * on top when needed), but the caller gets immediate feedback.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  let tid: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    tid = setTimeout(() => {
      const err = new Error('Request timed out. Please try again.');
      (err as any).code = 'TIMEOUT';
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(tid)) as Promise<T>;
};

/**
 * Read-after-write helper: fetches the newly inserted row by author + title.
 * Retries up to `maxAttempts` times with exponential back-off to handle
 * Supabase propagation delay after a write. Returns null only if all attempts fail.
 */
const fetchInsertedRow = async (
  authorId: string,
  title: string,
  maxAttempts = 3,
  baseDelayMs = 300
): Promise<Record<string, any> | null> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, baseDelayMs * attempt)); // 0ms, 300ms, 600ms
    }
    try {
      const { data } = await supabase
        .from('community_ideas')
        .select('*')
        .eq('author_id', authorId)
        .eq('title', title)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (data) return data;
    } catch {
      // network blip on fetch — continue to next attempt
    }
  }
  return null;
};

/**
 * Idempotency variant of fetchInsertedRow: fetches by (author_id, request_id)
 * instead of title. Only used when FEATURE_IDEMPOTENCY_KEY is true and the DB
 * column + unique index exist. Retries with back-off identical to fetchInsertedRow.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fetchInsertedRowByRequestId = async (
  authorId: string,
  requestId: string,
  maxAttempts = 3,
  baseDelayMs = 300
): Promise<Record<string, any> | null> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, baseDelayMs * attempt));
    }
    try {
      const { data } = await supabase
        .from('community_ideas')
        .select('*')
        .eq('author_id', authorId)
        .eq('request_id', requestId)
        .limit(1)
        .single();
      if (data) return data;
    } catch {
      // network blip — continue
    }
  }
  return null;
};

/**
 * Generates a unique request ID. Uses crypto.randomUUID when available (all
 * modern browsers), otherwise falls back to a timestamp + random suffix.
 */
const generateRequestId = (): string =>
  typeof crypto?.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** Stable UUID for this browser tab — generated once at module load. */
const TAB_ID = generateRequestId();

/**
 * Monotonically incrementing per-tab log sequence number.
 * Including `seq` in every log entry lets you reconstruct exact event ordering
 * across interleaved async operations without relying on wall-clock timestamps.
 */
let _tabLogSeq = 0;
const nextSeq = () => ++_tabLogSeq;

/**
 * Stable per-tab jitter salt derived from TAB_ID. Maps the first 8 hex digits
 * of the UUID to [0, 1) so reconnect backoff jitter is deterministic within a
 * tab but differs across tabs — preventing coordinated thundering-herd reconnects.
 */
const TAB_JITTER_SALT = parseInt(TAB_ID.replace(/-/g, '').slice(0, 8), 16) / 0xffffffff;

/** After a fetch completes, ignore realtime triggers for this long (ms). */
const REALTIME_COOLDOWN_MS = 500;
/** If a fetch has been running longer than this, the in-flight lock is considered stale and bypassed. */
const MAX_FETCH_STALENESS_MS = 15_000;

/** Bucket a latency value for log-based histogramming. */
const latencyBucket = (ms: number): string => {
  if (ms < 200) return 'fast';
  if (ms < 1000) return 'ok';
  if (ms < 5000) return 'slow';
  return 'very-slow';
};

/**
 * Lightweight content fingerprint for late-delivery matching.
 * Combines normalised title + first 50 chars of normalised description so two
 * ideas that share a title but differ in body do not falsely match.
 */
const makeContentHash = (title: string, description: string): string => {
  const normDesc = description.trim().replace(/\s+/g, ' ').toLowerCase();
  return `${title.trim().replace(/\s+/g, ' ').toLowerCase()}::${normDesc.slice(0, 50)}::${normDesc.length}`;
};

/**
 * Feature flag — flip to true AFTER running the DB migration:
 *   ALTER TABLE community_ideas ADD COLUMN request_id UUID;
 *   CREATE UNIQUE INDEX idx_community_ideas_author_request
 *     ON community_ideas (author_id, request_id);
 * When true: request_id is included in inserts and a 23505 conflict is
 * treated as idempotent success (fetch + display the existing row).
 */
const FEATURE_IDEMPOTENCY_KEY = false;

/** Maps a raw Supabase community_ideas row to a typed CommunityIdea. */
const mapRowToIdea = (row: any, hasUpvoted = false): CommunityIdea => ({
  id: row.id,
  title: row.title,
  description: row.description,
  tags: row.tags || [],
  upvotes: row.upvotes_count || 0,
  comments: row.comments_count || 0,
  author: row.author_name,
  authorAvatar: row.author_avatar,
  authorId: row.author_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  hasUpvoted,
});

const normalizeIdeaValue = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

const loadCommunityIdeas = (): CommunityIdea[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(COMMUNITY_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load community ideas:', error);
    return [];
  }
};

const persistCommunityIdeas = (ideas: CommunityIdea[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(ideas));
  } catch (error) {
    console.error('Failed to save community ideas:', error);
  }
};

const parseTags = (value: string) =>
  value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
    .slice(0, 5);

const getIdeaKey = (idea: Pick<CommunityIdea, 'title' | 'description'>) =>
  `${normalizeIdeaValue(idea.title)}::${normalizeIdeaValue(idea.description)}`;

const loadCommunityComments = (): Record<string, CommunityComment[]> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(COMMUNITY_COMMENTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load community comments:', error);
    return {};
  }
};

const persistCommunityComments = (comments: Record<string, CommunityComment[]>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COMMUNITY_COMMENTS_KEY, JSON.stringify(comments));
  } catch (error) {
    console.error('Failed to save community comments:', error);
  }
};

export function CommunityPage({ onNavigate }: CommunityPageProps) {
  const { profile, displayName, user } = useUser();
  const [filter, setFilter] = useState('trending');
  const [displayCount, setDisplayCount] = useState(5);
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [communityIdeas, _setCommunityIdeas] = useState<CommunityIdea[]>(() => loadCommunityIdeas());
  const [commentStore, setCommentStore] = useState<Record<string, CommunityComment[]>>(
    () => loadCommunityComments()
  );

  // Post Idea form state
  const [postFormOpen, setPostFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    tags: '',
  });
  const [formErrors, setFormErrors] = useState<{ title?: string; description?: string }>({});
  // Stable ref so toast retry callbacks always call the latest version of the handler
  const handleSubmitIdeaRef = useRef<(() => Promise<void>) | null>(null);
  // Increments before every fetchCommunityIdeas call; each call captures its own
  // generation and bails if a newer fetch has already applied its result.
  const fetchGenerationRef = useRef(0);
  // Debounce timer for coalescing rapid realtime events (e.g. burst of upvotes)
  // into a single refetch. Cleared on unmount.
  const realtimeFetchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // requestId → { title, authorId } for submissions that timed out but may still
  // succeed. Checked on every fetchCommunityIdeas to surface "Delivered" toasts.
  const timedOutSubmissionsRef = useRef<Map<string, { title: string; authorId: string; contentHash: string }>>(new Map());
  // How many times the user has attempted to submit in the current dialog session.
  // Reset when the dialog closes. Used in logs for debugging retry patterns.
  const submitAttemptRef = useRef(0);
  // True while a fetchCommunityIdeas call is in flight. Debounced realtime callbacks
  // skip if this is set, avoiding redundant parallel fetches during burst events.
  const isFetchingRef = useRef(false);
  // Holds the active Supabase realtime channel so the effect can remove it before
  // recreating — prevents orphaned duplicate channels on React StrictMode double-invoke.
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Set to true by debouncedFetch when it skips because isFetchingRef is set.
  // Checked in fetchCommunityIdeas finally to trigger a trailing refetch so no
  // realtime event is silently dropped while a fetch was in-flight.
  const missedWhileFetchingRef = useRef(false);
  // Wall-clock time when the current/last fetchCommunityIdeas started. Used by
  // debouncedFetch to detect stale in-flight locks (> MAX_FETCH_STALENESS_MS).
  const fetchStartTimeRef = useRef<number>(0);
  // Wall-clock time when the last fetchCommunityIdeas completed (success or error).
  // debouncedFetch drops realtime triggers within REALTIME_COOLDOWN_MS of this.
  const lastFetchCompletedAtRef = useRef<number>(0);

  // Analyzed ideas from Supabase
  const [analyzedIdeas, setAnalyzedIdeas] = useState<AnalyzedIdea[]>([]);
  const [selectedAnalyzedIdeaId, setSelectedAnalyzedIdeaId] = useState<string | null>(null);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);

  // Supabase community ideas
  const [supabaseIdeas, setSupabaseIdeas] = useState<CommunityIdea[]>([]);
  const [_isLoadingCommunityIdeas, setIsLoadingCommunityIdeas] = useState(true);
  const [postOptionDialogOpen, setPostOptionDialogOpen] = useState(false);
  // ID of the most recently posted idea — drives brief highlight + scroll-into-view
  const [highlightedIdeaId, setHighlightedIdeaId] = useState<string | null>(null);
  
  // Local upvotes for demo ideas (stored in localStorage)
  const [localUpvotes, setLocalUpvotes] = useState<Record<string, { count: number; hasUpvoted: boolean }>>(() => {
    try {
      const stored = localStorage.getItem('motif-demo-upvotes');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Persist local upvotes
  useEffect(() => {
    localStorage.setItem('motif-demo-upvotes', JSON.stringify(localUpvotes));
  }, [localUpvotes]);

  useEffect(() => {
    persistCommunityIdeas(communityIdeas);
  }, [communityIdeas]);

  useEffect(() => {
    persistCommunityComments(commentStore);
  }, [commentStore]);

  // Scroll newly posted idea into view and briefly highlight it
  useEffect(() => {
    if (!highlightedIdeaId) return;
    try {
      const el = document.getElementById(`idea-card-${highlightedIdeaId}`);
      // Element may not be in the current filtered/paginated view — scroll only if present
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch {
      // scrollIntoView can throw in detached/hidden DOM or some headless environments
    }
    const t = setTimeout(() => setHighlightedIdeaId(null), 2500);
    return () => clearTimeout(t);
  }, [highlightedIdeaId]);

  // Load comments from Supabase when the panel opens for a DB-backed idea
  useEffect(() => {
    if (!commentPanelOpen || !selectedIdea?.id) return;

    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('community_comments')
        .select('*')
        .eq('idea_id', selectedIdea.id)
        .order('created_at', { ascending: true });

      if (error || !data) return;

      const key = getIdeaKey(selectedIdea);
      const mapped: CommunityComment[] = data.map((c: any) => ({
        id: c.id,
        author: c.author_name,
        avatar: undefined,
        message: c.content,
        timestamp: new Date(c.created_at).toLocaleString(),
      }));
      setCommentStore(prev => ({ ...prev, [key]: mapped }));
    };

    fetchComments();
  }, [commentPanelOpen, selectedIdea?.id]);

  // Fetch analyzed ideas when post dialog opens
  useEffect(() => {
    if (postFormOpen && user) {
      fetchAnalyzedIdeas();
    }
  }, [postFormOpen, user]);

  // Fetch community ideas on mount and when user changes.
  // Recreated whenever `user` changes so the closure and channel both see the
  // current auth state. channelRef guarantees only one active subscription even
  // under React StrictMode double-invoke or rapid auth state changes.
  useEffect(() => {
    fetchCommunityIdeas();

    let destroyed = false;

    // Debounced fetch that skips if a fetch is already in-flight.
    // This coalesces burst realtime events (e.g. several upvotes in 300ms)
    // without launching redundant parallel network requests.
    // Two additional guards:
    //   Cooldown — drop events within REALTIME_COOLDOWN_MS of a completed fetch
    //              since the fresh data already covers them.
    //   Stale-lock bypass — if the in-flight fetch has run > MAX_FETCH_STALENESS_MS
    //              the lock is considered hung; allow a fresh fetch to proceed.
    const debouncedFetch = () => {
      if (realtimeFetchDebounceRef.current) clearTimeout(realtimeFetchDebounceRef.current);
      realtimeFetchDebounceRef.current = setTimeout(() => {
        // Drop redundant triggers that arrive right after a completed fetch
        if (Date.now() - lastFetchCompletedAtRef.current < REALTIME_COOLDOWN_MS) return;
        const fetchIsStale =
          isFetchingRef.current &&
          Date.now() - fetchStartTimeRef.current > MAX_FETCH_STALENESS_MS;
        if (isFetchingRef.current && !fetchIsStale) {
          missedWhileFetchingRef.current = true;
        } else {
          fetchCommunityIdeas();
        }
      }, 300);
    };

    // Creates the realtime channel and subscribes. Extracted so the error
    // handler can re-initialize after a disconnect without duplicating setup.
    // reconnectAttempt is closed over and drives exponential-backoff + jitter
    // so rapid transport errors do not hammer the server. Resets to 0 on SUBSCRIBED.
    let reconnectAttempt = 0;
    const initChannel = () => {
      if (destroyed) return;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      channelRef.current = supabase
        .channel(`community-ideas-${TAB_ID}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'community_ideas' }, debouncedFetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'community_upvotes' }, debouncedFetch)
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            // Successful (re)connect — reset backoff counter
            reconnectAttempt = 0;
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            const baseDelay = Math.min(1000 * 2 ** reconnectAttempt, 30000);
            // TAB_JITTER_SALT is stable per-tab so the delay is deterministic
            // within a tab yet differs across tabs, preventing simultaneous reconnects.
            const delayMs = Math.round(baseDelay + TAB_JITTER_SALT * 1000);
            reconnectAttempt += 1;
            console.warn('[IdeaForge:Community] channel disrupted — reinitializing', {
              seq: nextSeq(), status, attempt: reconnectAttempt, delayMs,
              feature: 'community-post', phase: 'realtime',
              ...(err ? { error: String(err) } : {}),
            });
            setTimeout(initChannel, delayMs);
          }
        });
    };

    initChannel();

    return () => {
      destroyed = true;
      if (realtimeFetchDebounceRef.current) {
        clearTimeout(realtimeFetchDebounceRef.current);
        realtimeFetchDebounceRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user]);

  const fetchAnalyzedIdeas = async () => {
    if (!user) return;

    setIsLoadingIdeas(true);
    try {
      const { data, error } = await supabase
        .from('idea_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching analyzed ideas:', error);
        toast.error('Failed to load your analyzed ideas');
        setAnalyzedIdeas([]);
      } else {
        setAnalyzedIdeas(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load your analyzed ideas');
      setAnalyzedIdeas([]);
    } finally {
      setIsLoadingIdeas(false);
    }
  };

  // Fetch community ideas from Supabase
  const fetchCommunityIdeas = async () => {
    // In-flight lock — realtime-triggered debounced fetches skip if one is already
    // running. Direct calls (mount, post-success fallback) always proceed.
    // The generation counter still guards result ordering for any concurrent fetches.
    const generation = ++fetchGenerationRef.current;
    isFetchingRef.current = true;
    fetchStartTimeRef.current = Date.now();
    setIsLoadingCommunityIdeas(true);
    try {
      const { data: ideas, error: ideasError } = await supabase
        .from('community_ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (ideasError) {
        console.error('Error fetching community ideas:', ideasError);
        if (ideasError.code === '42P01') {
          console.warn('⚠️ community_ideas table does not exist. Please run supabase-schema.sql');
        }
        if (generation === fetchGenerationRef.current) setSupabaseIdeas([]);
        return;
      }

      // Fetch user's upvotes if logged in
      let userUpvotes: string[] = [];
      if (user) {
        const { data: upvotes, error: upvotesError } = await supabase
          .from('community_upvotes')
          .select('idea_id')
          .eq('user_id', user.id);

        if (upvotesError) {
          console.error('Error fetching user upvotes:', upvotesError);
        } else if (upvotes) {
          userUpvotes = upvotes.map(u => u.idea_id);
        }
      }

      // Stale-response guard — discard if a newer fetch has already applied
      if (generation !== fetchGenerationRef.current) return;

      const mappedIdeas = (ideas || []).map(row =>
        mapRowToIdea(row, userUpvotes.includes(row.id))
      );

      // Late-delivery detection: a submission that timed out may have actually
      // succeeded. Match by content hash (title + first 50 chars of description)
      // rather than title alone to avoid false positives between similar ideas.
      // Snapshot entries before iterating so in-loop deletes do not affect iteration.
      // The has() check before acting is a claim-then-act guard: JS is single-threaded
      // between awaits, but the snapshot + claim pattern makes the intent explicit and
      // prevents the toast from firing twice if this code path is ever refactored.
      if (timedOutSubmissionsRef.current.size > 0) {
        for (const [reqId, { contentHash, authorId }] of Array.from(timedOutSubmissionsRef.current.entries())) {
          const delivered = mappedIdeas.find(
            i => i.authorId === authorId &&
                 makeContentHash(i.title, i.description) === contentHash
          );
          if (delivered && timedOutSubmissionsRef.current.has(reqId)) {
            // Claim the entry before any side-effect — prevents re-fire on the
            // same requestId even if this block is reached by a concurrent fetch.
            timedOutSubmissionsRef.current.delete(reqId);
            toast.success('Your post was delivered!', {
              description: `"${delivered.title}" is now live in the community.`,
              action: {
                label: 'View post',
                onClick: () => {
                  if (!delivered.id) return;
                  try {
                    const el = document.getElementById(`idea-card-${delivered.id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  } catch { /* detached DOM */ }
                },
              },
            });
            // Reuse the same highlight + scroll-into-view behavior as a normal post
            if (delivered.id) setHighlightedIdeaId(delivered.id);
          }
        }
      }

      // updated_at guard: if a locally-applied optimistic update (e.g. upvote) is
      // newer than the incoming DB row, preserve the local counters so the UI does
      // not briefly flicker back to the pre-update value.
      setSupabaseIdeas(prev => {
        const existingById = new Map(
          prev.filter(i => i.id && !i.id.startsWith('optimistic-')).map(i => [i.id!, i])
        );
        return mappedIdeas.map(incoming => {
          if (!incoming.id) return incoming;
          const existing = existingById.get(incoming.id);
          if (!existing) return incoming;
          // Parse both timestamps explicitly — either value may be absent or
          // unparseable (e.g. DB returns null for a newly-created row before a
          // trigger fires). Number.isFinite rejects NaN so we never compare
          // garbage values and never accidentally suppress a real DB update.
          const existingTs = existing.updatedAt
            ? new Date(existing.updatedAt).getTime()
            : NaN;
          const incomingTs = incoming.updatedAt
            ? new Date(incoming.updatedAt).getTime()
            : NaN;
          // +200ms skew tolerance: server clocks and JS Date parsing can drift by a
          // few milliseconds. Only treat local state as "newer" when the gap is
          // meaningful, so a same-millisecond tick never suppresses a real DB update.
          if (Number.isFinite(existingTs) && Number.isFinite(incomingTs) && existingTs > incomingTs + 200) {
            // Local state is meaningfully newer — keep existing interactive counters
            return { ...incoming, upvotes: existing.upvotes, hasUpvoted: existing.hasUpvoted };
          }
          return incoming;
        });
      });
    } catch (error) {
      console.error('Error fetching community ideas:', error);
      if (generation === fetchGenerationRef.current) setSupabaseIdeas([]);
    } finally {
      isFetchingRef.current = false;
      lastFetchCompletedAtRef.current = Date.now();
      if (generation === fetchGenerationRef.current) setIsLoadingCommunityIdeas(false);
      // A realtime event arrived while this fetch was in-flight and was skipped
      // to avoid a redundant parallel request. Do a trailing fetch now that we
      // are clear, so no DB change is silently dropped.
      // Cancel any pending debounce timer first so the direct call and the
      // debounced call don't both fire — only the trailing fetch below runs.
      if (missedWhileFetchingRef.current) {
        missedWhileFetchingRef.current = false;
        if (realtimeFetchDebounceRef.current) {
          clearTimeout(realtimeFetchDebounceRef.current);
          realtimeFetchDebounceRef.current = null;
        }
        fetchCommunityIdeas();
      }
    }
  };

  // Handle upvote with optimistic UI
  const handleUpvote = async (ideaId: string) => {
    if (!user) {
      toast.error('Please login to upvote ideas');
      return;
    }

    // Find the idea in supabaseIdeas (only Supabase ideas can be upvoted)
    const idea = supabaseIdeas.find(i => i.id === ideaId);
    if (!idea) {
      toast.error('This idea cannot be upvoted');
      return;
    }

    const wasUpvoted = idea.hasUpvoted;

    // Optimistic UI update
    setSupabaseIdeas(prev =>
      prev.map(i =>
        i.id === ideaId
          ? {
              ...i,
              upvotes: wasUpvoted ? i.upvotes - 1 : i.upvotes + 1,
              hasUpvoted: !wasUpvoted,
            }
          : i
      )
    );

    try {
      if (wasUpvoted) {
        // Remove upvote
        const { error } = await supabase
          .from('community_upvotes')
          .delete()
          .eq('idea_id', ideaId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Delete upvote error:', error);
          throw error;
        }
      } else {
        // Add upvote
        const { error } = await supabase
          .from('community_upvotes')
          .insert({
            idea_id: ideaId,
            user_id: user.id,
          });

        if (error) {
          console.error('Insert upvote error:', error);
          throw error;
        }
      }
      
      // Success - no toast needed as optimistic UI already updated
    } catch (error: any) {
      console.error('Error toggling upvote:', error);

      // Revert optimistic update on error
      setSupabaseIdeas(prev =>
        prev.map(i =>
          i.id === ideaId
            ? {
                ...i,
                upvotes: wasUpvoted ? i.upvotes + 1 : i.upvotes - 1,
                hasUpvoted: wasUpvoted,
              }
            : i
        )
      );

      // Show specific error messages
      if (error.code === '23505') {
        toast.error('You have already upvoted this idea');
      } else if (error.code === '42P01') {
        toast.error('Database tables not set up. Please run the Supabase schema.');
      } else if (error.code === '42501' || error.message?.includes('policy')) {
        toast.error('Permission denied. Please check RLS policies.');
      } else if (error.message) {
        toast.error(`Failed to update upvote: ${error.message}`);
      } else {
        toast.error('Failed to update upvote. Please try again.');
      }
    }
  };

  // Handle upvote for demo/seed ideas (local only)
  const handleDemoUpvote = (ideaTitle: string, currentUpvotes: number) => {
    const key = `demo:${ideaTitle}`;
    const current = localUpvotes[key] || { count: currentUpvotes, hasUpvoted: false };
    
    setLocalUpvotes(prev => ({
      ...prev,
      [key]: {
        count: current.hasUpvoted ? current.count - 1 : current.count + 1,
        hasUpvoted: !current.hasUpvoted
      }
    }));
  };

  // Combine Supabase ideas, localStorage ideas, and seed ideas
  const allIdeas = [...supabaseIdeas, ...communityIdeas, ...seedIdeas].map(idea => {
    const key = getIdeaKey(idea);
    const storedCount = commentStore[key]?.length ?? idea.comments;
    
    // Apply local upvotes for demo ideas (those without id)
    const demoKey = `demo:${idea.title}`;
    const localUpvote = localUpvotes[demoKey];
    
    return { 
      ...idea, 
      comments: storedCount,
      // Use local upvote data for demo ideas
      upvotes: localUpvote ? localUpvote.count : idea.upvotes,
      hasUpvoted: idea.id ? idea.hasUpvoted : (localUpvote?.hasUpvoted || false)
    };
  });

  // Filter and sort ideas based on selected filter and tag
  const getFilteredIdeas = () => {
    let filtered = [...allIdeas];

    // Filter by tag if selected
    if (selectedTag) {
      filtered = filtered.filter(idea => idea.tags.includes(selectedTag));
    }

    if (filter === 'trending') {
      // Only posts from the last 7 days, ranked by engagement (upvotes + comments)
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter(idea => {
        const ts = idea.createdAt ? new Date(idea.createdAt).getTime() : NaN;
        return Number.isFinite(ts) && ts >= sevenDaysAgo;
      });
      filtered.sort((a, b) => (b.upvotes + b.comments) - (a.upvotes + a.comments));
    } else if (filter === 'new') {
      filtered.sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    } else if (filter === 'discussed') {
      filtered.sort((a, b) => b.comments - a.comments);
    } else if (filter === 'upvoted') {
      filtered.sort((a, b) => b.upvotes - a.upvotes);
    }

    return filtered;
  };

  const filteredIdeas = getFilteredIdeas();
  const ideas = filteredIdeas.slice(0, displayCount);
  const hasMore = displayCount < filteredIdeas.length;

  const handleLoadMore = () => {
    setDisplayCount(Math.min(displayCount + 5, filteredIdeas.length));
  };

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      // If clicking the same tag, deselect it
      setSelectedTag(null);
    } else {
      // Select the new tag
      setSelectedTag(tag);
    }
    // Reset display count when tag changes
    setDisplayCount(5);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    // Reset display count when filter changes
    setDisplayCount(5);
  };

  // Validation for post form
  const isPostTitleValid = postForm.title.trim().length >= 10;
  const isPostDescriptionValid = postForm.description.trim().length >= 30;

  const validateManualForm = (): boolean => {
    const errors: { title?: string; description?: string } = {};
    if (!postForm.title.trim()) {
      errors.title = 'Title is required';
    } else if (postForm.title.trim().length < 10) {
      errors.title = `${10 - postForm.title.trim().length} more characters needed`;
    }
    if (!postForm.description.trim()) {
      errors.description = 'Description is required';
    } else if (postForm.description.trim().length < 30) {
      errors.description = `${30 - postForm.description.trim().length} more characters needed`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitIdea = async () => {
    if (!user) {
      toast.error('Please login to post an idea');
      return;
    }
    if (isSubmitting) return;
    submitAttemptRef.current += 1;

    // ── 1. Sync validation (before any state changes) ──────────────────────
    if (analyzedIdeas.length > 0) {
      if (!selectedAnalyzedIdeaId) {
        toast.error('Please select an idea to share');
        return;
      }
    } else {
      if (!validateManualForm()) return;
    }

    // ── 2. Build submission payload synchronously ───────────────────────────
    const authorName = profile?.name?.trim() || displayName?.trim() || 'Founder';
    let postTitle: string;
    let postDescription: string;
    let postTags: string[];
    const isAnalyzedPath = analyzedIdeas.length > 0;

    if (isAnalyzedPath) {
      const selectedIdea = analyzedIdeas.find(idea => idea.id === selectedAnalyzedIdeaId);
      if (!selectedIdea) {
        toast.error('Selected idea not found. Please reselect and try again.');
        return;
      }
      postTitle = selectedIdea.idea_title.trim();
      postDescription = selectedIdea.idea_description.trim();
      const derivedTags: string[] = [];
      if (selectedIdea.target_market) {
        derivedTags.push(
          ...selectedIdea.target_market.split(/[,/]/).map(t => t.trim()).filter(Boolean).slice(0, 3)
        );
      }
      postTags = derivedTags.length > 0 ? derivedTags : ['AI', 'Innovation'];
    } else {
      postTitle = postForm.title.trim();
      postDescription = postForm.description.trim();
      const parsed = parseTags(postForm.tags);
      postTags = parsed.length > 0 ? parsed : ['General'];
    }

    // ── 3. Optimistic UI insert (instant feedback) ──────────────────────────
    // requestId ties the optimistic entry, logs, and post-insert fetch together
    // so any delayed or duplicate responses can be matched and discarded safely.
    const requestId = generateRequestId();
    const optimisticId = `optimistic-${requestId}`;
    const optimisticEntry: CommunityIdea = {
      id: optimisticId,
      title: postTitle,
      description: postDescription,
      tags: postTags,
      upvotes: 0,
      comments: 0,
      author: authorName,
      authorAvatar: profile?.avatar || undefined,
      authorId: user.id,
      createdAt: new Date().toISOString(),
      hasUpvoted: false,
    };
    setSupabaseIdeas(prev => [optimisticEntry, ...prev]);
    setIsSubmitting(true);
    const startTime = Date.now();

    try {
      // ── 4. Duplicate check (catches race conditions + re-posts) ──────────
      const { data: existingIdeas, error: fetchError } = await withTimeout(
        supabase.from('community_ideas').select('id, title, description').eq('author_id', user.id) as unknown as Promise<{ data: any; error: any }>,
        12000
      );

      if (fetchError) throw fetchError;

      const isDuplicate = existingIdeas?.some(
        (idea: any) =>
          normalizeIdeaValue(idea.title) === normalizeIdeaValue(postTitle) &&
          normalizeIdeaValue(idea.description) === normalizeIdeaValue(postDescription)
      );

      if (isDuplicate) {
        setSupabaseIdeas(prev => prev.filter(i => i.id !== optimisticId));
        toast.info('You have already shared this idea in the community.');
        return;
      }

      // ── 5. Insert with timeout ───────────────────────────────────────────
      const { error: insertError } = await withTimeout(
        supabase.from('community_ideas').insert({
          title: postTitle,
          description: postDescription,
          tags: postTags,
          author_name: authorName,
          author_avatar: profile?.avatar || null,
          author_id: user.id,
          // FEATURE_IDEMPOTENCY_KEY gates request_id until the DB migration runs:
          //   ALTER TABLE community_ideas ADD COLUMN request_id UUID;
          //   CREATE UNIQUE INDEX idx_community_ideas_author_request
          //     ON community_ideas (author_id, request_id);
          // When true, a 23505 on insert means "already processed" → fetch + display.
          ...(FEATURE_IDEMPOTENCY_KEY ? { request_id: requestId } : {}),
        }) as unknown as Promise<{ error: any }>,
        12000
      );

      if (insertError) throw insertError;

      // ── 6. Replace optimistic entry with the real DB row ────────────────
      // fetchInsertedRow retries up to 3 times (0ms / 300ms / 600ms) to handle
      // Supabase read-after-write propagation delay. The optimistic entry stays
      // visible the entire time so the user never sees a disappearing post.
      const inserted = await fetchInsertedRow(user.id, postTitle);

      if (inserted) {
        const realEntry = mapRowToIdea(inserted);
        setSupabaseIdeas(prev => {
          // Strip all optimistic-* entries + deduplicate the real ID,
          // then prepend the confirmed row. Handles the race where the
          // real-time subscription already inserted the row via fetchCommunityIdeas.
          const cleaned = prev.filter(
            i => !i.id?.startsWith('optimistic-') && i.id !== inserted.id
          );
          return [realEntry, ...cleaned];
        });
        setHighlightedIdeaId(inserted.id);
        console.info('[IdeaForge:Community] post confirmed', { seq: nextSeq(), requestId, realId: inserted.id, feature: 'community-post', phase: 'read-after-write' });
      } else {
        // All retries exhausted — strip optimistic and do a full list refresh.
        // The real-time subscription will also trigger fetchCommunityIdeas
        // independently, so the row will appear even if this branch runs.
        setSupabaseIdeas(prev => prev.filter(i => i.id !== optimisticId));
        console.warn('[IdeaForge:Community] read-after-write: row not found after retries, falling back to full refetch', { seq: nextSeq(), requestId, feature: 'community-post', phase: 'read-after-write' });
        fetchCommunityIdeas();
      }

      toast.success('Idea posted to the community!');
      if (isAnalyzedPath) {
        setSelectedAnalyzedIdeaId(null);
      } else {
        setPostForm({ title: '', description: '', tags: '' });
        setFormErrors({});
      }
      setPostFormOpen(false);
    } catch (error: any) {
      // ── 7. Rollback: remove optimistic entry + all stale optimistic entries
      setSupabaseIdeas(prev => prev.filter(i => !i.id?.startsWith('optimistic-')));

      logError('post-idea', error, {
        eventId: requestId,
        requestId,
        tabId: TAB_ID,
        route: 'community/post-idea',
        attempt: submitAttemptRef.current,
        userId: user.id,
        ideaTitle: postTitle,
        payload: { titleLength: postTitle.length, descriptionLength: postDescription.length, tags: postTags },
        durationMs: Date.now() - startTime,
        feature: 'community-post',
        phase: error?.code === 'TIMEOUT' ? 'insert-timeout' : 'insert',
      });

      const isNetwork =
        error instanceof TypeError ||
        error?.message?.toLowerCase().includes('failed to fetch') ||
        error?.message?.toLowerCase().includes('networkerror');
      const isTimeout = error?.code === 'TIMEOUT';

      if (isTimeout) {
        // Register so fetchCommunityIdeas can show "Delivered" if the request
        // eventually succeeds and the row appears via the realtime subscription.
        // contentHash prevents false positives when two ideas share the same title.
        timedOutSubmissionsRef.current.set(requestId, {
          title: postTitle,
          authorId: user.id,
          contentHash: makeContentHash(postTitle, postDescription),
        });
        toast.error('Request timed out. Check your connection.', {
          action: { label: 'Retry', onClick: () => handleSubmitIdeaRef.current?.() },
          duration: 8000,
        });
      } else if (isNetwork) {
        toast.error('Network error. Check your connection.', {
          action: { label: 'Retry', onClick: () => handleSubmitIdeaRef.current?.() },
          duration: 8000,
        });
      } else if (error?.code === '23505') {
        if (FEATURE_IDEMPOTENCY_KEY) {
          // Idempotent conflict: request_id unique index fired, meaning this exact
          // request was already processed. Fetch the existing row by (author_id, request_id)
          // so we get the precise row rather than the most-recent by title.
          // The 23505 conflict proves the row exists — use tighter back-off (150ms
          // base, 3 attempts) since propagation delay here is typically very short.
          const existing = await fetchInsertedRowByRequestId(user.id, requestId, 3, 150);
          if (existing) {
            const realEntry = mapRowToIdea(existing);
            setSupabaseIdeas(prev => {
              const cleaned = prev.filter(
                i => !i.id?.startsWith('optimistic-') && i.id !== existing.id
              );
              return [realEntry, ...cleaned];
            });
            setHighlightedIdeaId(existing.id);
            // Log before toast so the seq number reflects order of side-effects
            console.info('[IdeaForge:Community] post confirmed (idempotent recovery)', {
              seq: nextSeq(), requestId, realId: existing.id,
              feature: 'community-post', phase: 'idempotent-recovery',
            });
            toast.success('Idea posted to the community!');
            if (isAnalyzedPath) { setSelectedAnalyzedIdeaId(null); }
            else { setPostForm({ title: '', description: '', tags: '' }); setFormErrors({}); }
            setPostFormOpen(false);
          } else {
            toast.info('You have already shared this idea in the community.');
          }
        } else {
          toast.info('You have already shared this idea in the community.');
        }
      } else if (error?.code === '42501' || error?.message?.includes('policy') || error?.message?.includes('JWT')) {
        toast.error('Permission denied. Please log out and log back in.');
      } else if (error?.code === '42P01') {
        toast.error('Database not set up. Please contact support.');
      } else if (error?.message) {
        toast.error(`Failed to post idea: ${error.message}`);
      } else {
        toast.error('Failed to post idea. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  // Keep ref current on every render so toast retry always calls the latest closure
  handleSubmitIdeaRef.current = handleSubmitIdea;

  const handleCommentClick = (idea: any) => {
    setSelectedIdea(idea);
    setCommentPanelOpen(true);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !selectedIdea) return;

    const key = getIdeaKey(selectedIdea);
    const authorName = profile?.name?.trim() || displayName?.trim() || 'Founder';
    const commentText = newComment.trim();
    const newEntry: CommunityComment = {
      id: `${Date.now()}`,
      author: authorName,
      avatar: profile?.avatar || undefined,
      message: commentText,
      timestamp: new Date().toLocaleString(),
    };

    // Optimistic UI update
    setCommentStore(prev => {
      const existing = prev[key] || [];
      return { ...prev, [key]: [...existing, newEntry] };
    });
    setSelectedIdea({ ...selectedIdea, comments: (selectedIdea.comments || 0) + 1 });
    setNewComment('');

    // Persist to Supabase for real community ideas (those with a DB id)
    if (selectedIdea.id) {
      try {
        await supabase.from('community_comments').insert({
          idea_id: selectedIdea.id,
          user_id: user?.id || null,
          author_name: authorName,
          content: commentText,
        });
      } catch (error) {
        console.error('Failed to save comment to database:', error);
      }
    }

    toast.success('Comment posted.');
  };


  const selectedIdeaComments = selectedIdea
    ? commentStore[getIdeaKey(selectedIdea)] || []
    : [];

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden py-12 md:py-14" style={{ background: 'linear-gradient(135deg, rgba(201, 167, 235, 0.85) 0%, rgba(176, 132, 232, 0.9) 100%)' }}>
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="mb-3 font-['Poppins'] text-3xl font-bold text-white md:text-4xl">
              Founder Community
            </h1>
            <p className="mx-auto mb-6 max-w-xl text-base text-white/85">
              Share your ideas, get feedback, and connect with fellow entrepreneurs
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              {/* Post Option Dialog */}
              <Dialog open={postOptionDialogOpen} onOpenChange={setPostOptionDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="default"
                    className="rounded-xl bg-white text-primary font-semibold px-6 hover:bg-white/95 shadow-lg"
                  >
                    Post an Idea
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Share Your Idea</DialogTitle>
                    <DialogDescription>
                      Choose how you'd like to proceed
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-6">
                    <Card
                      className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                      onClick={() => {
                        setPostOptionDialogOpen(false);
                        onNavigate?.('Idea Analyser');
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
                            <Sparkles className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">Analyze a New Idea</h4>
                            <p className="text-sm text-muted-foreground">
                              Get AI-powered insights before sharing with the community
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card
                      className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                      onClick={() => {
                        setPostOptionDialogOpen(false);
                        setPostFormOpen(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                            <MessageSquare className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold mb-1">Post an Existing Analyzed Idea</h4>
                            <p className="text-sm text-muted-foreground">
                              Share an idea you've already analyzed with AI
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Post Form Dialog */}
              <Dialog open={postFormOpen} onOpenChange={open => { setPostFormOpen(open); if (!open) { setSelectedAnalyzedIdeaId(null); setPostForm({ title: '', description: '', tags: '' }); setFormErrors({}); submitAttemptRef.current = 0; } }}>
                <DialogContent className="sm:max-w-lg p-0 gap-0 max-h-[90vh] flex flex-col">
                  <DialogHeader className="px-6 pt-6 pb-3 flex-shrink-0">
                    <DialogTitle>Share Your Startup Idea</DialogTitle>
                  </DialogHeader>

                  {/* Scroll area */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
                    {isLoadingIdeas ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="mt-4 text-sm text-muted-foreground">Loading your ideas...</p>
                      </div>
                    ) : analyzedIdeas.length === 0 ? (
                      /* ── Manual form when user has no analyzed ideas ── */
                      <div className="space-y-4 py-2">
                        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                          <Lightbulb className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-700">
                            You haven't analyzed any ideas yet. You can still post manually, or{' '}
                            <button
                              className="underline font-medium"
                              onClick={() => { setPostFormOpen(false); onNavigate?.('Idea Analyser'); }}
                            >
                              analyze an idea first
                            </button>{' '}
                            for AI-powered insights.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="post-title">
                            Title <span className="text-muted-foreground text-xs">(min 10 chars)</span>
                          </Label>
                          <Input
                            id="post-title"
                            placeholder="e.g. AI-powered scheduling tool for freelancers"
                            value={postForm.title}
                            onChange={e => { setPostForm(f => ({ ...f, title: e.target.value })); if (formErrors.title) setFormErrors(prev => ({ ...prev, title: undefined })); }}
                            maxLength={200}
                            className={formErrors.title ? 'border-destructive focus-visible:ring-destructive' : ''}
                          />
                          {formErrors.title ? (
                            <p className="text-xs text-destructive">{formErrors.title}</p>
                          ) : postForm.title.length > 0 && !isPostTitleValid ? (
                            <p className="text-xs text-muted-foreground">{10 - postForm.title.trim().length} more characters needed</p>
                          ) : null}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="post-description">
                            Description <span className="text-muted-foreground text-xs">(min 30 chars)</span>
                          </Label>
                          <Textarea
                            id="post-description"
                            placeholder="Describe your idea, the problem it solves, and your target audience..."
                            value={postForm.description}
                            onChange={e => { setPostForm(f => ({ ...f, description: e.target.value })); if (formErrors.description) setFormErrors(prev => ({ ...prev, description: undefined })); }}
                            className={`min-h-[100px] resize-none${formErrors.description ? ' border-destructive focus-visible:ring-destructive' : ''}`}
                            maxLength={2000}
                          />
                          {formErrors.description ? (
                            <p className="text-xs text-destructive">{formErrors.description}</p>
                          ) : postForm.description.length > 0 && !isPostDescriptionValid ? (
                            <p className="text-xs text-muted-foreground">{30 - postForm.description.trim().length} more characters needed</p>
                          ) : null}
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="post-tags">
                            Tags <span className="text-muted-foreground text-xs">(optional, comma-separated)</span>
                          </Label>
                          <Input
                            id="post-tags"
                            placeholder="e.g. AI, SaaS, HealthTech"
                            value={postForm.tags}
                            onChange={e => setPostForm(f => ({ ...f, tags: e.target.value }))}
                          />
                        </div>
                      </div>
                    ) : (
                      /* ── Analyzed ideas selector ── */
                      <div className="space-y-2">
                        <Label>Select an idea to share</Label>
                        <div className="space-y-2 pr-1">
                          {analyzedIdeas.map((idea) => (
                            <Card
                              key={idea.id}
                              className={`cursor-pointer transition-all hover:border-primary ${
                                selectedAnalyzedIdeaId === idea.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border'
                              }`}
                              onClick={() => setSelectedAnalyzedIdeaId(idea.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 mt-1">
                                    <div
                                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                        selectedAnalyzedIdeaId === idea.id
                                          ? 'border-primary bg-primary'
                                          : 'border-muted-foreground'
                                      }`}
                                    >
                                      {selectedAnalyzedIdeaId === idea.id && (
                                        <div className="h-2 w-2 rounded-full bg-white" />
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm mb-1 line-clamp-2">
                                      {idea.idea_title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                      {idea.idea_description}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      {idea.score && (
                                        <Badge variant="secondary" className="text-xs">
                                          Score: {idea.score}/100
                                        </Badge>
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(idea.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer — always visible */}
                  {!isLoadingIdeas && (
                    <div className="px-6 py-4 border-t border-border space-y-2">
                      {/* Hint when nothing selected */}
                      {analyzedIdeas.length > 0 && !selectedAnalyzedIdeaId && (
                        <p className="text-xs text-center text-muted-foreground">
                          Select an idea above to enable posting
                        </p>
                      )}
                      <Button
                        onClick={handleSubmitIdea}
                        disabled={isSubmitting}
                        className="gradient-lavender shadow-lavender w-full rounded-[16px] hover:opacity-90"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : analyzedIdeas.length > 0 ? (
                          'Share Selected Idea'
                        ) : (
                          'Post Idea'
                        )}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-background py-8 md:py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            {/* Ideas Feed */}
            <div className="space-y-4 lg:col-span-2">
              {/* Filters */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filter === 'trending' ? 'default' : 'outline'}
                    onClick={() => handleFilterChange('trending')}
                    size="sm"
                    className="rounded-full h-8"
                  >
                    <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                    Trending
                  </Button>
                  <Button
                    variant={filter === 'new' ? 'default' : 'outline'}
                    onClick={() => handleFilterChange('new')}
                    size="sm"
                    className="rounded-full h-8"
                  >
                    <Clock className="mr-1.5 h-3.5 w-3.5" />
                    New
                  </Button>
                  <Button
                    variant={filter === 'discussed' ? 'default' : 'outline'}
                    onClick={() => handleFilterChange('discussed')}
                    size="sm"
                    className="rounded-full h-8"
                  >
                    <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                    Most Discussed
                  </Button>
                  <Button
                    variant={filter === 'upvoted' ? 'default' : 'outline'}
                    onClick={() => handleFilterChange('upvoted')}
                    size="sm"
                    className="rounded-full h-8"
                  >
                    <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
                    Most Upvoted
                  </Button>
                </div>

                {selectedTag && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Filtering by tag:</span>
                    <Badge variant="default" className="rounded-full">
                      {selectedTag}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTag(null);
                        setDisplayCount(5);
                      }}
                      className="h-6 px-2 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              {/* Ideas List */}
              <div className="space-y-3">
                {ideas.length === 0 ? (
                  <Card className="border-dashed border-2">
                    <CardContent className="p-12 text-center">
                      <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-semibold">No ideas found</h3>
                      <p className="text-muted-foreground mb-4">
                        {selectedTag
                          ? `No ideas match the "${selectedTag}" tag. Try selecting a different tag.`
                          : 'No ideas match the current filter.'}
                      </p>
                      {selectedTag && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedTag(null);
                            setDisplayCount(5);
                          }}
                        >
                          Clear tag filter
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  ideas.map((idea, index) => (
                    <motion.div
                      id={`idea-card-${idea.id || idea.title}`}
                      key={idea.id || idea.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={
                        idea.id && idea.id === highlightedIdeaId
                          ? 'ring-2 ring-primary ring-offset-2 rounded-xl transition-shadow duration-300'
                          : undefined
                      }
                    >
                      <IdeaCard
                        {...idea}
                        onCommentClick={() => handleCommentClick(idea)}
                        onUpvote={
                          idea.id
                            ? () => handleUpvote(idea.id!)
                            : () => handleDemoUpvote(idea.title, idea.upvotes)
                        }
                        hasUpvoted={idea.hasUpvoted}
                      />
                    </motion.div>
                  ))
                )}
              </div>

              {hasMore && (
                <div className="pt-2 text-center">
                  <Button variant="outline" size="sm" onClick={handleLoadMore} className="rounded-lg px-6">
                    Load More Ideas
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Filter</h3>
                </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'AI',
                      'SaaS',
                      'Mobile',
                      'Web3',
                      'HealthTech',
                      'Fintech',
                      'EdTech',
                      'B2B',
                      'E-commerce',
                      'No-Code',
                    ].map(tag => (
                      <Badge
                        key={tag}
                        variant={selectedTag === tag ? 'default' : 'secondary'}
                        className="hover:bg-primary hover:text-primary-foreground cursor-pointer rounded-full transition-all"
                        onClick={() => handleTagClick(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {selectedTag && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTag(null);
                        setDisplayCount(5);
                      }}
                      className="mt-3 w-full text-xs"
                    >
                      Clear filter
                    </Button>
                  )}
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-4 flex items-center gap-2">
                  <Award className="text-primary h-4 w-4" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Top Contributors</h3>
                </div>
                <div className="space-y-3">
                    {leaderboard.map((user, index) => (
                      <div key={user.name} className="flex items-center gap-2.5">
                        <div className="flex-shrink-0">
                          <div
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                              index === 0
                                ? 'bg-yellow-500 text-white'
                                : index === 1
                                  ? 'bg-gray-400 text-white'
                                  : index === 2
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {index + 1}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{user.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {user.points} pts · {user.ideas} ideas
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment Panel */}
      <Sheet open={commentPanelOpen} onOpenChange={setCommentPanelOpen}>
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-l border-border bg-background sm:w-[500px]"
        >
          <SheetHeader className="border-b border-border pb-4">
            <SheetTitle className="text-xl font-semibold">
              Comments
            </SheetTitle>
          </SheetHeader>

          {selectedIdea && (
            <div className="mt-4 space-y-4">
              {/* Idea Summary */}
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <h4 className="mb-2 font-medium line-clamp-2">{selectedIdea.title}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedIdea.authorAvatar} alt={selectedIdea.author} />
                    <AvatarFallback className="text-xs">
                      {selectedIdea.author[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedIdea.author}</span>
                  <span>·</span>
                  <span>{selectedIdea.comments} comments</span>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {selectedIdeaComments.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-8 text-center">
                    <MessageCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm font-medium mb-1">No comments yet</p>
                    <p className="text-xs text-muted-foreground">Be the first to share your feedback on this idea.</p>
                  </div>
                ) : (
                  selectedIdeaComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="rounded-lg border border-border bg-card p-3"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.avatar} alt={comment.author} />
                          <AvatarFallback className="text-xs">
                            {comment.author[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-foreground/90 pl-10">
                        {comment.message}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input */}
              <div className="sticky bottom-0 rounded-lg border border-border bg-background p-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Share your feedback..."
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendComment()}
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={handleSendComment}
                    disabled={!newComment.trim()}
                    size="sm"
                    className="gradient-lavender"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
