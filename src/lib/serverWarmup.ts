/**
 * Server Warmup Service
 *
 * Prevents Render free-tier cold starts by:
 *  1. Pinging /api/ping immediately on app load
 *  2. Retrying every 3 s until the server responds (covers the ~30–60 s Render boot)
 *  3. Sending a keep-alive ping every 10 minutes to prevent future sleeps
 *
 * Usage:
 *   serverWarmup.start();          // call once in App.tsx on mount
 *   serverWarmup.getStatus();      // 'unknown' | 'warming' | 'warm' | 'unavailable'
 *   serverWarmup.subscribe(fn);    // reactive updates; returns unsubscribe fn
 *   serverWarmup.waitUntilWarm();  // Promise that resolves when warm (or rejects on timeout)
 */

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string) ||
  (import.meta.env.DEV ? 'http://localhost:8080' : '');

const PING_URL = `${BACKEND_URL}/api/ping`;
const PING_TIMEOUT_MS = 5_000;
const RETRY_INTERVAL_MS = 3_000;
const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1_000; // 10 min — Render sleeps after 15
const MAX_WARMUP_ATTEMPTS = 30;                  // 30 × 3 s = 90 s ceiling

export type WarmupStatus = 'unknown' | 'warming' | 'warm' | 'unavailable';
type Listener = (status: WarmupStatus) => void;

class ServerWarmupService {
  private status: WarmupStatus = 'unknown';
  private listeners = new Set<Listener>();
  private keepAliveHandle: ReturnType<typeof setInterval> | null = null;
  private started = false;

  // ── Public API ────────────────────────────────────────────────────────────

  getStatus(): WarmupStatus {
    return this.status;
  }

  isWarm(): boolean {
    return this.status === 'warm';
  }

  /**
   * Subscribe to status changes. The listener is called immediately with the
   * current status. Returns an unsubscribe function.
   */
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.status);
    return () => this.listeners.delete(fn);
  }

  /**
   * Start the warmup process. Safe to call multiple times — only runs once.
   * Call this in App.tsx on mount so warmup begins before any user interaction.
   */
  start(): void {
    if (this.started) return;
    this.started = true;
    this.runWarmup();
  }

  /**
   * Returns a Promise that resolves when the server is warm, or rejects after
   * `timeoutMs` milliseconds. Use this before firing any AI request.
   */
  waitUntilWarm(timeoutMs = 90_000): Promise<void> {
    if (this.status === 'warm') return Promise.resolve();

    return new Promise((resolve, reject) => {
      const deadline = setTimeout(() => {
        unsub();
        reject(new Error('Server warmup timed out'));
      }, timeoutMs);

      const unsub = this.subscribe((s) => {
        if (s === 'warm') {
          clearTimeout(deadline);
          unsub();
          resolve();
        } else if (s === 'unavailable') {
          clearTimeout(deadline);
          unsub();
          reject(new Error('Server is unavailable'));
        }
      });
    });
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private notify(s: WarmupStatus) {
    this.status = s;
    this.listeners.forEach((fn) => fn(s));
  }

  private async ping(): Promise<boolean> {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    try {
      const res = await fetch(PING_URL, { method: 'GET', signal: controller.signal });
      clearTimeout(tid);
      return res.ok;
    } catch {
      clearTimeout(tid);
      return false;
    }
  }

  private async runWarmup() {
    // First attempt — fast path for already-warm servers
    if (await this.ping()) {
      this.notify('warm');
      this.startKeepAlive();
      return;
    }

    // Server is cold — enter polling loop
    this.notify('warming');

    for (let attempt = 1; attempt < MAX_WARMUP_ATTEMPTS; attempt++) {
      await new Promise<void>((r) => setTimeout(r, RETRY_INTERVAL_MS));
      if (await this.ping()) {
        this.notify('warm');
        this.startKeepAlive();
        return;
      }
    }

    // 90 s elapsed and still no response
    this.notify('unavailable');
  }

  private startKeepAlive() {
    if (this.keepAliveHandle !== null) return;

    this.keepAliveHandle = setInterval(async () => {
      const ok = await this.ping();
      if (!ok) {
        // Server went cold unexpectedly — restart warmup cycle
        clearInterval(this.keepAliveHandle!);
        this.keepAliveHandle = null;
        this.started = false;
        this.notify('unknown');
        this.start();
      }
    }, KEEP_ALIVE_INTERVAL_MS);
  }
}

export const serverWarmup = new ServerWarmupService();
