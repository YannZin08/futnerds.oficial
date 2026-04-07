CREATE TABLE `userFavoriteTeams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`teamId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userFavoriteTeams_id` PRIMARY KEY(`id`)
);
