import { pgTable, text, timestamp, uuid, numeric, date } from "drizzle-orm/pg-core";

export const properties = pgTable("properties", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	userId: uuid("user_id").notNull(),
	shareToken: text("share_token").unique(),
	shareTokenExpiresAt: timestamp("share_token_expires_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
	id: uuid("id").primaryKey().defaultRandom(),
	propertyId: uuid("property_id")
		.references(() => properties.id, { onDelete: "cascade" })
		.notNull(),
	date: date("date").notNull(),
	description: text("description").notNull(),
	amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
	type: text("type").notNull().$type<"income" | "expense">(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shareVisits = pgTable("share_visits", {
	id: uuid("id").primaryKey().defaultRandom(),
	propertyId: uuid("property_id")
		.references(() => properties.id, { onDelete: "cascade" })
		.notNull(),
	visitedAt: timestamp("visited_at").defaultNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type ShareVisit = typeof shareVisits.$inferSelect;
export type NewShareVisit = typeof shareVisits.$inferInsert;
