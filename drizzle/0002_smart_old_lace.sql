CREATE TABLE `collaborator_invites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` varchar(128) NOT NULL,
	`ownerUserId` int NOT NULL,
	`inviteeEmail` varchar(320) NOT NULL,
	`access` enum('read','write') NOT NULL DEFAULT 'read',
	`status` enum('pending','accepted','revoked') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `collaborator_invites_id` PRIMARY KEY(`id`)
);
