"use server";

import { db } from "@/lib/db";
import { properties, transactions, shareVisits } from "@/lib/schema";
import { getUser } from "@/lib/auth-server";
import { eq, and, count, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logSecurityEvent } from "@/lib/security-logger";

const propertyIdSchema = z.string().uuid("Invalid property ID");

// Share token expires after 7 days
const SHARE_TOKEN_EXPIRY_DAYS = 7;

/**
 * Generate a share token for a property
 * Creates a new random token that can be used to share the report publicly
 */
export async function generateShareToken(propertyId: string) {
	try {
		const user = await getUser();
		if (!user) {
			return { error: "Please sign in to continue", data: null };
		}

		const validation = propertyIdSchema.safeParse(propertyId);
		if (!validation.success) {
			return { error: validation.error.issues[0].message, data: null };
		}

		// Verify property ownership
		const property = await db
			.select()
			.from(properties)
			.where(and(eq(properties.id, propertyId), eq(properties.userId, user.id)))
			.limit(1);

		if (property.length === 0) {
			return { error: "Property not found", data: null };
		}

		// Generate a new share token with expiration
		const shareToken = crypto.randomUUID();
		const shareTokenExpiresAt = new Date(
			Date.now() + SHARE_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
		);

		await db
			.update(properties)
			.set({ shareToken, shareTokenExpiresAt })
			.where(eq(properties.id, propertyId));

		logSecurityEvent("share.generated", {
			userId: user.id,
			propertyId,
		});

		revalidatePath("/dashboard");
		return { error: null, data: { shareToken } };
	} catch (error) {
		console.error("Failed to generate share token:", error);
		return { error: "Unable to generate share link. Please try again.", data: null };
	}
}

/**
 * Revoke a share token for a property
 * Removes the share token, making the public link invalid
 */
export async function revokeShareToken(propertyId: string) {
	try {
		const user = await getUser();
		if (!user) {
			return { error: "Please sign in to continue" };
		}

		const validation = propertyIdSchema.safeParse(propertyId);
		if (!validation.success) {
			return { error: validation.error.issues[0].message };
		}

		// Verify property ownership
		const property = await db
			.select()
			.from(properties)
			.where(and(eq(properties.id, propertyId), eq(properties.userId, user.id)))
			.limit(1);

		if (property.length === 0) {
			return { error: "Property not found" };
		}

		await db
			.update(properties)
			.set({ shareToken: null, shareTokenExpiresAt: null })
			.where(eq(properties.id, propertyId));

		logSecurityEvent("share.revoked", {
			userId: user.id,
			propertyId,
		});

		revalidatePath("/dashboard");
		return { error: null, success: true };
	} catch (error) {
		console.error("Failed to revoke share token:", error);
		return { error: "Unable to revoke share link. Please try again." };
	}
}

/**
 * Get shared report data by token (public - no auth required)
 * Also logs a visit for analytics
 */
export async function getSharedReport(token: string) {
	try {
		const tokenValidation = z.string().uuid().safeParse(token);
		if (!tokenValidation.success) {
			return { error: "Invalid share link", data: null };
		}

		// Find property by share token
		const property = await db
			.select()
			.from(properties)
			.where(eq(properties.shareToken, token))
			.limit(1);

		if (property.length === 0) {
			return { error: "Report not found or link has been revoked", data: null };
		}

		const propertyData = property[0];

		// Check if share token has expired
		if (
			propertyData.shareTokenExpiresAt &&
			new Date() > new Date(propertyData.shareTokenExpiresAt)
		) {
			return {
				error: "This share link has expired. Please request a new link from the owner.",
				data: null,
			};
		}

		// Get transactions for this property
		const transactionsData = await db
			.select()
			.from(transactions)
			.where(eq(transactions.propertyId, propertyData.id))
			.orderBy(transactions.date);

		// Log the visit with deduplication (only count once per hour per property)
		// This prevents inflated counts from page refreshes
		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
		db.select({ count: count() })
			.from(shareVisits)
			.where(
				and(eq(shareVisits.propertyId, propertyData.id), gte(shareVisits.visitedAt, oneHourAgo))
			)
			.then((result) => {
				// Only log if no recent visit exists
				if (result[0]?.count === 0) {
					db.insert(shareVisits)
						.values({ propertyId: propertyData.id })
						.catch((err) => console.error("Failed to log visit:", err));
				}
			})
			.catch((err) => console.error("Failed to check recent visits:", err));

		return {
			error: null,
			data: {
				property: {
					id: propertyData.id,
					name: propertyData.name,
				},
				transactions: transactionsData,
			},
		};
	} catch (error) {
		console.error("Failed to get shared report:", error);
		return { error: "Unable to load report. Please try again.", data: null };
	}
}

/**
 * Get visit count for a property (owner only)
 */
export async function getVisitCount(propertyId: string) {
	try {
		const user = await getUser();
		if (!user) {
			return { error: "Please sign in to continue", data: null };
		}

		const validation = propertyIdSchema.safeParse(propertyId);
		if (!validation.success) {
			return { error: validation.error.issues[0].message, data: null };
		}

		// Verify property ownership
		const property = await db
			.select()
			.from(properties)
			.where(and(eq(properties.id, propertyId), eq(properties.userId, user.id)))
			.limit(1);

		if (property.length === 0) {
			return { error: "Property not found", data: null };
		}

		const result = await db
			.select({ count: count() })
			.from(shareVisits)
			.where(eq(shareVisits.propertyId, propertyId));

		return { error: null, data: { count: result[0]?.count || 0 } };
	} catch (error) {
		console.error("Failed to get visit count:", error);
		return { error: "Unable to get visit count.", data: null };
	}
}

/**
 * Get property share status for dashboard (owner only)
 */
export async function getShareStatus(propertyId: string) {
	try {
		const user = await getUser();
		if (!user) {
			return { error: "Please sign in to continue", data: null };
		}

		const validation = propertyIdSchema.safeParse(propertyId);
		if (!validation.success) {
			return { error: validation.error.issues[0].message, data: null };
		}

		// Get property with share token
		const property = await db
			.select({
				shareToken: properties.shareToken,
				shareTokenExpiresAt: properties.shareTokenExpiresAt,
			})
			.from(properties)
			.where(and(eq(properties.id, propertyId), eq(properties.userId, user.id)))
			.limit(1);

		if (property.length === 0) {
			return { error: "Property not found", data: null };
		}

		// Get visit count
		const visitResult = await db
			.select({ count: count() })
			.from(shareVisits)
			.where(eq(shareVisits.propertyId, propertyId));

		return {
			error: null,
			data: {
				isShared: !!property[0].shareToken,
				shareToken: property[0].shareToken,
				expiresAt: property[0].shareTokenExpiresAt,
				visitCount: visitResult[0]?.count || 0,
			},
		};
	} catch (error) {
		console.error("Failed to get share status:", error);
		return { error: "Unable to get share status.", data: null };
	}
}
