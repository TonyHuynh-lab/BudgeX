CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`theme` text DEFAULT 'system' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL
);
