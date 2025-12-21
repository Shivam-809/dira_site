DROP TABLE `tarot_sessions`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cart` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`product_id` integer NOT NULL,
	`quantity` integer DEFAULT 1,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_cart`("id", "user_id", "product_id", "quantity", "created_at", "updated_at") SELECT "id", "user_id", "product_id", "quantity", "created_at", "updated_at" FROM `cart`;--> statement-breakpoint
DROP TABLE `cart`;--> statement-breakpoint
ALTER TABLE `__new_cart` RENAME TO `cart`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_orders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`items` text,
	`total_amount` real,
	`status` text DEFAULT 'pending' NOT NULL,
	`payment_intent_id` text,
	`shipping_address` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_orders`("id", "user_id", "items", "total_amount", "status", "payment_intent_id", "shipping_address", "created_at", "updated_at") SELECT "id", "user_id", "items", "total_amount", "status", "payment_intent_id", "shipping_address", "created_at", "updated_at" FROM `orders`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;--> statement-breakpoint
ALTER TABLE `user` ADD `role` text DEFAULT 'user' NOT NULL;