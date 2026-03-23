CREATE TABLE `news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`summary` text NOT NULL,
	`content` text NOT NULL,
	`imageUrl` text,
	`category` enum('ultimate_team','career_mode','pro_clubs','volta','patch','general') NOT NULL DEFAULT 'general',
	`tags` text,
	`featured` boolean NOT NULL DEFAULT false,
	`authorId` int,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `news_id` PRIMARY KEY(`id`),
	CONSTRAINT `news_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`position` varchar(16) NOT NULL,
	`nationality` varchar(64) NOT NULL,
	`club` varchar(128) NOT NULL,
	`league` varchar(128) NOT NULL,
	`overall` int NOT NULL,
	`pace` int,
	`shooting` int,
	`passing` int,
	`dribbling` int,
	`defending` int,
	`physical` int,
	`cardType` enum('gold','silver','bronze','toty','tots','icon','hero','special') NOT NULL DEFAULT 'gold',
	`rating` float,
	`imageUrl` text,
	`flagUrl` text,
	`clubLogoUrl` text,
	`price` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userFavoritePlayers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`playerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userFavoritePlayers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `username` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `favoriteTeam` varchar(128);