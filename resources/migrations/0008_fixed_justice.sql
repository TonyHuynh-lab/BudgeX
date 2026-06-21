CREATE TABLE `investment_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `stock_positions` ADD `accountId` integer REFERENCES investment_accounts(id);