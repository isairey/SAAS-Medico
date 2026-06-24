CREATE TABLE `clinical_systems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`system` enum('cardiovascular','metabolico','endocrino','digestivo','neuro_humor','sono','atividade_fisica') NOT NULL,
	`conditionCode` varchar(50) NOT NULL,
	`conditionName` varchar(255) NOT NULL,
	`status` enum('diagnosticado','potencial','descartado','em_investigacao') NOT NULL DEFAULT 'potencial',
	`severity` enum('leve','moderado','grave') DEFAULT 'leve',
	`notes` text,
	`diagnosedAt` varchar(10),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clinical_systems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `physical_activity_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dailyReportId` int NOT NULL,
	`patientId` int NOT NULL,
	`activityType` varchar(100) NOT NULL,
	`frequencyPerWeek` int,
	`period` enum('manha','tarde','noite'),
	`intensity` enum('leve','moderada','intensa'),
	`durationMinutes` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `physical_activity_details_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `polypharmacy_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`medicationA` varchar(255) NOT NULL,
	`medicationB` varchar(255),
	`interactionType` enum('contraindicacao','precaucao','monitorar','limiar_polifarmacia') NOT NULL,
	`description` text NOT NULL,
	`threshold` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `polypharmacy_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `protocol_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`sessionId` int,
	`documentType` enum('protocolo','anamnese','relatorio') NOT NULL DEFAULT 'protocolo',
	`title` varchar(255) NOT NULL,
	`fileUrl` text,
	`fileKey` varchar(255),
	`scoreBand` varchar(50),
	`score` int,
	`signedByName` varchar(255),
	`signedByCRM` varchar(50),
	`signedAt` timestamp,
	`sentVia` enum('whatsapp','email','nenhum') DEFAULT 'nenhum',
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `protocol_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sleep_details` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dailyReportId` int NOT NULL,
	`patientId` int NOT NULL,
	`fallingAsleep` decimal(4,1),
	`waking` decimal(4,1),
	`fragmented` decimal(4,1),
	`daytimeSleepiness` decimal(4,1),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sleep_details_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`assignedProfile` enum('enfermagem','medico_assistente','supervisor','nao_atribuido') NOT NULL DEFAULT 'nao_atribuido',
	`assignedToId` int,
	`priority` enum('baixa','normal','alta','urgente') NOT NULL DEFAULT 'normal',
	`reason` varchar(255) NOT NULL,
	`source` varchar(100),
	`status` enum('pendente','em_atendimento','concluido') NOT NULL DEFAULT 'pendente',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_queue_id` PRIMARY KEY(`id`)
);
