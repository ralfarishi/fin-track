"use server";

import { db } from "@/lib/db";
import { properties } from "@/lib/schema";
import { getUser } from "@/lib/auth-server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logSecurityEvent } from "@/lib/security-logger";

const propertySchema = z.object({
	name: z
		.string()
		.min(2, "Name must be at least 2 characters")
		.max(50, "Name must be less than 50 characters"),
});

export async function getProperties() {
	try {
		const user = await getUser();
		if (!user) {
			return { error: "Please sign in to continue", data: null };
		}

		const data = await db.select().from(properties).where(eq(properties.userId, user.id));
		return { error: null, data };
	} catch (error) {
		console.error("Failed to fetch properties:", error);
		return { error: "Unable to load properties. Please try again.", data: null };
	}
}

export async function createProperty(formData: FormData) {
	try {
		const user = await getUser();
		if (!user) {
			return { error: "Please sign in to continue" };
		}

		const name = formData.get("name") as string;
		const validation = propertySchema.safeParse({ name });

		if (!validation.success) {
			return { error: validation.error.issues[0].message };
		}

		const result = await db
			.insert(properties)
			.values({
				name: validation.data.name,
				userId: user.id,
			})
			.returning({ id: properties.id });

		logSecurityEvent("property.created", {
			userId: user.id,
			propertyId: result[0]?.id,
		});

		revalidatePath("/dashboard");
		return { error: null, success: true };
	} catch (error) {
		console.error("Failed to create property:", error);
		return { error: "Unable to create property. Please try again." };
	}
}

export async function deleteProperty(id: string) {
	try {
		const user = await getUser();
		if (!user) {
			return { error: "Please sign in to continue" };
		}

		// Validate UUID format
		const idValidation = z.string().uuid("Invalid property ID").safeParse(id);
		if (!idValidation.success) {
			return { error: "Invalid property ID" };
		}

		// Verify ownership before deletion
		const property = await db
			.select()
			.from(properties)
			.where(and(eq(properties.id, id), eq(properties.userId, user.id)))
			.limit(1);

		if (property.length === 0) {
			return { error: "Property not found" };
		}

		await db.delete(properties).where(eq(properties.id, id));

		logSecurityEvent("property.deleted", {
			userId: user.id,
			propertyId: id,
		});

		revalidatePath("/dashboard");
		return { error: null, success: true };
	} catch (error) {
		console.error("Failed to delete property:", error);
		return { error: "Unable to delete property. Please try again." };
	}
}
