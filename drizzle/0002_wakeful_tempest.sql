CREATE TABLE `clinical_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`flagType` enum('validation','warning','info') NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text NOT NULL,
	`source` varchar(100),
	`sourceId` int,
	`status` enum('pendente','aprovado','rejeitado') NOT NULL DEFAULT 'pendente',
	`validatedById` int,
	`validatedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clinical_flags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `flow_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`configKey` varchar(100) NOT NULL,
	`configValue` varchar(50) NOT NULL,
	`showToggle` boolean NOT NULL DEFAULT true,
	`description` text,
	`ifOn` text,
	`ifOff` text,
	`defaultProfile` varchar(50),
	`notes` text,
	CONSTRAINT `flow_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `flow_config_configKey_unique` UNIQUE(`configKey`)
);
--> statement-breakpoint
CREATE TABLE `funnel_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`stage` enum('iniciou_e_parou','concluiu_clinico','concluiu_financeiro','alto_interesse','convertido') NOT NULL,
	`scoreBand` varchar(50),
	`score` int,
	`stoppedAtStep` int,
	`stoppedAtModule` varchar(50),
	`notes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `funnel_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`dosageUnit` varchar(50),
	`dosageValue` decimal(10,2),
	`associatedDisease` varchar(100),
	`morningQty` int NOT NULL DEFAULT 0,
	`afternoonQty` int NOT NULL DEFAULT 0,
	`nightQty` int NOT NULL DEFAULT 0,
	`totalDaily` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `motor_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`triggerCode` varchar(50) NOT NULL,
	`triggerCondition` varchar(100) NOT NULL,
	`actionType` enum('formula','exame','encaminhamento','alerta','painel') NOT NULL,
	`actionValue` text NOT NULL,
	`priority` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `motor_actions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scoring_bands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`minScore` int NOT NULL,
	`maxScore` int NOT NULL,
	`description` text,
	`color` varchar(20),
	`actions` json,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `scoring_bands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scoring_weights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`questionCode` varchar(50) NOT NULL,
	`axis` varchar(50) NOT NULL,
	`weight` decimal(5,2) NOT NULL,
	`maxRawPoints` int NOT NULL DEFAULT 10,
	`isActive` boolean NOT NULL DEFAULT true,
	CONSTRAINT `scoring_weights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `anamnesis_questions` MODIFY COLUMN `category` enum('integrativa','estetica','relato_diario') NOT NULL;--> statement-breakpoint
ALTER TABLE `anamnesis_questions` ADD `code` varchar(50);--> statement-breakpoint
ALTER TABLE `anamnesis_questions` ADD `block` varchar(50);--> statement-breakpoint
ALTER TABLE `anamnesis_questions` ADD `step` int;--> statement-breakpoint
ALTER TABLE `anamnesis_questions` ADD `clinicalGoal` text;--> statement-breakpoint
ALTER TABLE `anamnesis_questions` ADD `commercialGoal` text;--> statement-breakpoint
ALTER TABLE `anamnesis_questions` ADD `helper` text;--> statement-breakpoint
ALTER TABLE `anamnesis_questions` ADD `technicalName` varchar(255);--> statement-breakpoint
ALTER TABLE `anamnesis_questions` ADD `weight` decimal(5,2);--> statement-breakpoint
ALTER TABLE `anamnesis_questions` ADD `videoUrl` varchar(500);