CREATE TABLE `session_bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`session_type` text NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`duration` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`client_name` text NOT NULL,
	`client_email` text NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
