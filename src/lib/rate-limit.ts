/**
 * Simple client-side rate limiter backed by localStorage.
 *
 * This is a defense-in-depth measure against brute-force / enumeration
 * attempts from a single browser. It is NOT a substitute for server-side
 * rate limiting, but it raises the cost of automated attacks and protects
 * the app's own auth endpoints from rapid repeated calls.
 */

interface RateLimitConfig {
  /** Maximum number of attempts allowed within the window. */
  maxAttempts: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

interface RateLimitState {
  attempts: number[];
}

const STORAGE_PREFIX = "rl:";

function readState(key: string): RateLimitState {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return { attempts: [] };
    const parsed = JSON.parse(raw) as RateLimitState;
    if (!parsed || !Array.isArray(parsed.attempts)) return { attempts: [] };
    return parsed;
  } catch {
    return { attempts: [] };
  }
}

function writeState(key: string, state: RateLimitState): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(state));
  } catch {
    // Ignore storage failures (private mode, quota, etc.)
  }
}

/**
 * Returns the number of milliseconds the caller must wait before the next
 * attempt is allowed. Returns 0 when an attempt is currently permitted.
 */
export function getRateLimitRemainingMs(key: string, config: RateLimitConfig): number {
  const now = Date.now();
  const state = readState(key);
  const recent = state.attempts.filter((t) => now - t < config.windowMs);

  if (recent.length < config.maxAttempts) return 0;

  // Oldest attempt in the window determines when a slot frees up.
  const oldest = Math.min(...recent);
  return Math.max(0, config.windowMs - (now - oldest));
}

/**
 * Records an attempt for the given key. Call this only when an attempt is
 * actually made (e.g. after a failed login), not when it is blocked.
 */
export function recordAttempt(key: string, config: RateLimitConfig): void {
  const now = Date.now();
  const state = readState(key);
  const recent = state.attempts.filter((t) => now - t < config.windowMs);
  recent.push(now);
  writeState(key, { attempts: recent });
}

/**
 * Clears the attempt history for a key (e.g. after a successful login).
 */
export function clearAttempts(key: string): void {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // Ignore storage failures.
  }
}

/**
 * Formats a remaining-ms value into a short human-readable message.
 */
export function formatWaitTime(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} segundo${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minuto${minutes === 1 ? "" : "s"}`;
}

export const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMs: 5 * 60 * 1000 },
  cpfSearch: { maxAttempts: 10, windowMs: 5 * 60 * 1000 },
  passwordReset: { maxAttempts: 3, windowMs: 15 * 60 * 1000 },
} as const;
