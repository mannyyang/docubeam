import { relations } from "drizzle-orm/relations";
import { users, documents } from "./schema";

export const documentsRelations = relations(documents, ({one}) => ({
	user: one(users, {
		fields: [documents.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	documents: many(documents),
}));