CREATE TABLE `document_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` varchar(128) NOT NULL,
	`userId` int NOT NULL,
	`access` enum('read','write') NOT NULL DEFAULT 'write',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `document_access_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
