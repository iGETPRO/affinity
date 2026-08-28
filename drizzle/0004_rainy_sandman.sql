ALTER TABLE `collaborator_invites` ADD `tokenHash` varchar(128) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `collaborator_invites` ADD `acceptedAt` timestamp;--> statement-breakpoint
ALTER TABLE `collaborator_invites` ADD CONSTRAINT `collaborator_invites_tokenHash_unique` UNIQUE(`tokenHash`);