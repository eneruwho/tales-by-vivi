// Per-isolate cache for public reads.
//
// OpenNext on Cloudflare is configured without an incremental cache, so
// unstable_cache cannot be relied on to persist between requests. Worker
// isolates stay warm for many requests, so a small in-memory layer keeps
// Supabase reads to roughly one per TTL instead of one per page view.
//
// - Concurrent callers share one in-flight load.
// - A failed load never overwrites good data; stale data is served instead
//   (up to STALE_MS) so a Supabase hiccup does not blank the site.
// - Failures are not cached, so the next request retries.

const FRESH_MS = 5 * 60 * 1000;
const STALE_MS = 24 * 60 * 60 * 1000;

const entries = new Map();

export async function memoize(key, loader, { freshMs = FRESH_MS } = {}) {
  const now = Date.now();
  const entry = entries.get(key);

  if (entry && "value" in entry && now - entry.loadedAt < freshMs) {
    return entry.value;
  }
  if (entry?.pending) return entry.pending;

  const pending = (async () => {
    try {
      const value = await loader();
      entries.set(key, { value, loadedAt: Date.now() });
      return value;
    } catch (error) {
      const stale = entries.get(key);
      if (stale && "value" in stale && Date.now() - stale.loadedAt < STALE_MS) {
        console.warn(`Serving stale "${key}":`, error?.message || error);
        entries.set(key, { value: stale.value, loadedAt: stale.loadedAt });
        return stale.value;
      }
      entries.delete(key);
      throw error;
    }
  })();

  entries.set(key, { ...(entry && "value" in entry ? entry : {}), pending });
  return pending;
}

export function clearMemoryCache() {
  entries.clear();
}
