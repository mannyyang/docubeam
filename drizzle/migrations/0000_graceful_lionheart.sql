CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`page_count` integer NOT NULL,
	`upload_date` text NOT NULL,
	`r2_key` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);