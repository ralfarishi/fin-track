/**
 * Simple in-memory rate limiter for server actions
 * For production at scale, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
	count: number;
	resetTime: number;
}

// In-memory store (resets on server restart)
const rateLimitStore = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
	/** Maximum number of requests allowed */
	maxRequests: number;
	/** Time window in milliseconds */
	windowMs: number;
}

interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetInMs: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, user email, or combination)
 * @param config - Rate limit configuration
 * @returns Whether the request is allowed and remaining quota
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
	const now = Date.now();
	const entry = rateLimitStore.get(identifier);

	// Clean up expired entries periodically (every 100 checks)
	if (Math.random() < 0.01) {
		cleanupExpiredEntries(now);
	}

	// If no entry exists or window has expired, create new entry
	if (!entry || now >= entry.resetTime) {
		const newEntry: RateLimitEntry = {
			count: 1,
			resetTime: now + config.windowMs,
		};
		rateLimitStore.set(identifier, newEntry);
		return {
			allowed: true,
			remaining: config.maxRequests - 1,
			resetInMs: config.windowMs,
		};
	}

	// Entry exists and window is still active
	entry.count++;
	const remaining = Math.max(0, config.maxRequests - entry.count);
	const resetInMs = entry.resetTime - now;

	if (entry.count > config.maxRequests) {
		return {
			allowed: false,
			remaining: 0,
			resetInMs,
		};
	}

	return {
		allowed: true,
		remaining,
		resetInMs,
	};
}

/**
 * Clean up expired rate limit entries to prevent memory leaks
 */
function cleanupExpiredEntries(now: number) {
	for (const [key, entry] of rateLimitStore.entries()) {
		if (now >= entry.resetTime) {
			rateLimitStore.delete(key);
		}
	}
}

// Preset configurations for common use cases
export const RATE_LIMITS = {
	/** Login attempts: 5 per minute per IP/email */
	LOGIN: { maxRequests: 5, windowMs: 60 * 1000 },
	/** API calls: 100 per minute */
	API: { maxRequests: 100, windowMs: 60 * 1000 },
	/** Share link generation: 10 per hour */
	SHARE: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
} as const;
