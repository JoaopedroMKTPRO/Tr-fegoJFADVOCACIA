CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`ig_user_id` text NOT NULL,
	`username` text NOT NULL,
	`account_type` text,
	`access_token` text NOT NULL,
	`token_expires_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `accounts_ig_user_id_unique` ON `accounts` (`ig_user_id`);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`caption` text DEFAULT '',
	`media_json` text DEFAULT '[]' NOT NULL,
	`scheduled_at` integer,
	`published_at` integer,
	`ig_media_id` text,
	`ig_permalink` text,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `posts_status_scheduled_idx` ON `posts` (`status`, `scheduled_at`);
--> statement-breakpoint
CREATE INDEX `posts_account_idx` ON `posts` (`account_id`);
