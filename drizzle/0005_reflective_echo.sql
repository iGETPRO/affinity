CREATE TABLE `collaboration_audit` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` varchar(128) NOT NULL,
	`actorUserId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`targetId` varchar(128),
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collaboration_audit_id` PRIMARY KEY(`id`)
);
