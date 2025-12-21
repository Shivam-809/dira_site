CREATE TABLE `admin` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false,
	`name` text NOT NULL,
	`image` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_email_unique` ON `admin` (`email`);--> statement-breakpoint
CREATE TABLE `admin_account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text DEFAULT 'credential' NOT NULL,
	`admin_id` text NOT NULL,
	`password` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `admin`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `admin_session` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`admin_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`admin_id`) REFERENCES `admin`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_session_token_unique` ON `admin_session` (`token`);--> statement-breakpoint
ALTER TABLE `user` DROP COLUMN `role`;