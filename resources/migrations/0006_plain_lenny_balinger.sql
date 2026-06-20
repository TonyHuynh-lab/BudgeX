CREATE TABLE `cashback_rates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`accountId` integer NOT NULL,
	`category` text NOT NULL,
	`rate` real DEFAULT 0 NOT NULL,
	FOREIGN KEY (`accountId`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_category` ON `cashback_rates` (`accountId`,`category`);