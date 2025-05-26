import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull(),
  size: integer('size').notNull(),
  pageCount: integer('page_count').notNull(),
  uploadDate: text('upload_date').notNull().$defaultFn(() => new Date().toISOString()),
  r2Key: text('r2_key').notNull(), // Key for R2 storage
});

export const documentUser = sqliteTable('document_user', {
  documentId: text('document_id').notNull().references(() => documents.id),
  userId: integer('user_id').notNull().references(() => users.id),
  role: text('role').notNull().$defaultFn(() => 'owner'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  pk: primaryKey({ columns: [table.documentId, table.userId] }),
}));
