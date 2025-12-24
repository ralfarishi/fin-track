"use server";

import { db } from "@/lib/db";
import { transactions, properties } from "@/lib/schema";
import { getUser } from "@/lib/auth-server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const transactionSchema = z.object({
	propertyId: z.string().uuid("Please select a valid property"),
	date: z.string().min(1, "Date is required"),
	description: z
		.string()
		.min(3, "Description must be at least 3 characters")
		.max(100, "Description is too long"),
	amount: z.coerce.number().positive("Amount must be greater than zero"),
	type: z.enum(["income", "expense"]),
});

export async function getTransactions(propertyId: string) {
	try {
		const user = await getUser();
		if (!user) {
			return { error: "Please sign in to continue", data: null };
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

		const data = await db
			.select()
			.from(transactions)
			.where(eq(transactions.propertyId, propertyId))
			.orderBy(transactions.date);

		return { error: null, data };
	} catch (error) {
		console.error("Failed to fetch transactions:", error);
		return { error: "Unable to load transactions. Please try again.", data: null };
	}
}

export async function createTransaction(formData: FormData) {
	try {
		const user = await getUser();
		if (!user) {
			return { error: "Please sign in to continue" };
		}

		const rawData = {
			propertyId: formData.get("propertyId") as string,
			date: formData.get("date") as string,
			description: formData.get("description") as string,
			amount: formData.get("amount") as string,
			type: formData.get("type") as string,
		};

		const validation = transactionSchema.safeParse(rawData);

		if (!validation.success) {
			return { error: validation.error.issues[0].message };
		}

		// Verify property ownership
		const property = await db
			.select()
			.from(properties)
			.where(and(eq(properties.id, validation.data.propertyId), eq(properties.userId, user.id)))
			.limit(1);

		if (property.length === 0) {
			return { error: "Property not found" };
		}

		await db.insert(transactions).values({
			propertyId: validation.data.propertyId,
			date: validation.data.date,
			description: validation.data.description,
			amount: validation.data.amount.toString(),
			type: validation.data.type,
		});

		revalidatePath("/dashboard");
		return { error: null, success: true };
	} catch (error) {
		console.error("Failed to create transaction:", error);
		return { error: "Unable to save transaction. Please try again." };
	}
}

export async function deleteTransaction(id: string) {
	try {
		const user = await getUser();
		if (!user) {
			return { error: "Please sign in to continue" };
		}

		// Verify ownership through property join
		const txn = await db
			.select({ propertyId: transactions.propertyId })
			.from(transactions)
			.where(eq(transactions.id, id))
			.limit(1);

		if (txn.length === 0) {
			return { error: "Transaction not found" };
		}

		const property = await db
			.select()
			.from(properties)
			.where(and(eq(properties.id, txn[0].propertyId), eq(properties.userId, user.id)))
			.limit(1);

		if (property.length === 0) {
			return { error: "You don't have permission to delete this transaction" };
		}

		await db.delete(transactions).where(eq(transactions.id, id));
		revalidatePath("/dashboard");
		return { error: null, success: true };
	} catch (error) {
		console.error("Failed to delete transaction:", error);
		return { error: "Unable to delete transaction. Please try again." };
	}
}
