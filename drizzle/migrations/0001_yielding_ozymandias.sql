CREATE TABLE `document_user` (
	`document_id` text NOT NULL,
	`user_id` integer NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL,
	PRIMARY KEY(`document_id`, `user_id`),
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`page_count` integer NOT NULL,
	`upload_date` text NOT NULL,
	`r2_key` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_documents`("id", "name", "size", "page_count", "upload_date", "r2_key") SELECT "id", "name", "size", "page_count", "upload_date", "r2_key" FROM `documents`;--> statement-breakpoint
DROP TABLE `documents`;--> statement-breakpoint
ALTER TABLE `__new_documents` RENAME TO `documents`;--> statement-breakpoint
PRAGMA foreign_keys=ON;