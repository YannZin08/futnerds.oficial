CREATE TABLE `squadPlayers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`squadId` int NOT NULL,
	`playerId` int NOT NULL,
	`slot` enum('starter','bench') NOT NULL DEFAULT 'starter',
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `squadPlayers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `squads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`teamId` int NOT NULL,
	`teamName` varchar(128) NOT NULL,
	`teamLogoUrl` text,
	`shareToken` varchar(64),
	`title` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `squads_id` PRIMARY KEY(`id`),
	CONSTRAINT `squads_shareToken_unique` UNIQUE(`shareToken`)
);
