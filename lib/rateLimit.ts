// lib/rateLimit.ts
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) {
        store.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);

/**
 * Simple in‑memory rate limiter.
 * @param ip – client IP address
 * @param max – max number of requests
 * @param windowMs – time window in milliseconds (default 60000 = 1 min)
 * @returns `true` if allowed, `false` if rate limit exceeded
 */
export function checkRateLimit(
  ip: string,
  max: number = 5,
  windowMs: number = 60000,
): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= max) {
    return false; // limit exceeded
  }

  entry.count++;
  return true;
}
