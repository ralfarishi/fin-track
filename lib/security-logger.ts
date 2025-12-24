/**
 * Security logging utilities for audit trail
 * In production, consider using a structured logging service like Axiom, Logtail, or Sentry
 */

export type SecurityEvent =
	| "auth.login.success"
	| "auth.login.failed"
	| "auth.logout"
	| "property.created"
	| "property.deleted"
	| "share.generated"
	| "share.revoked"
	| "share.accessed"
	| "access.denied";

interface LogContext {
	userId?: string;
	email?: string;
	propertyId?: string;
	ip?: string;
	userAgent?: string;
	reason?: string;
}

/**
 * Log a security event with context
 * In production, send to a logging service instead of console
 */
export function logSecurityEvent(event: SecurityEvent, context: LogContext = {}) {
	const timestamp = new Date().toISOString();
	const logEntry = {
		timestamp,
		event,
		...context,
	};

	// In development, log to console with color coding
	if (process.env.NODE_ENV === "development") {
		const colors: Record<string, string> = {
			"auth.login.success": "\x1b[32m", // Green
			"auth.login.failed": "\x1b[31m", // Red
			"auth.logout": "\x1b[33m", // Yellow
			"property.deleted": "\x1b[35m", // Magenta
			"access.denied": "\x1b[31m", // Red
			default: "\x1b[36m", // Cyan
		};
		const color = colors[event] || colors.default;
		console.log(`${color}[SECURITY]${"\x1b[0m"}`, JSON.stringify(logEntry));
	} else {
		// In production, use structured logging
		// Replace with your production logging solution
		console.log("[SECURITY]", JSON.stringify(logEntry));
	}
}
