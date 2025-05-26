import { sqliteTable, AnySQLiteColumn, foreignKey, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const documents = sqliteTable("documents", {
	id: text().primaryKey().notNull(),
	userId: integer("user_id").references(() => users.id),
	name: text().notNull(),
	size: integer().notNull(),
	pageCount: integer("page_count").notNull(),
	uploadDate: text("upload_date").notNull(),
	r2Key: text("r2_key").notNull(),
});

export const users = sqliteTable("users", {
	id: integer().primaryKey({ autoIncrement: true }).notNull(),
	email: text().notNull(),
	name: text(),
	createdAt: text("created_at").notNull(),
	updatedAt: text("updated_at").notNull(),
},
(table) => [
	uniqueIndex("users_email_unique").on(table.email),
]);

