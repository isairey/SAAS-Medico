CREATE TABLE `alert_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`source` varchar(100) NOT NULL,
	`conditionExpr` text NOT NULL,
	`alertCategory` varchar(100) NOT NULL,
	`alertPriority` enum('baixa','moderada','alta','critica') NOT NULL DEFAULT 'moderada',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alert_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`priority` enum('baixa','moderada','alta','critica') NOT NULL DEFAULT 'moderada',
	`title` varchar(255) NOT NULL,
	`description` text,
	`source` varchar(100),
	`sourceId` int,
	`status` enum('ativo','em_analise','resolvido','descartado') NOT NULL DEFAULT 'ativo',
	`assignedToId` int,
	`resolvedAt` timestamp,
	`resolutionNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `anamnesis_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('integrativa','estetica') NOT NULL,
	`section` varchar(100) NOT NULL,
	`questionText` text NOT NULL,
	`fieldType` enum('text','number','scale','select','multiselect','checkbox','date','textarea') NOT NULL,
	`options` json,
	`scaleMin` int,
	`scaleMax` int,
	`isRequired` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anamnesis_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `anamnesis_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`questionId` int NOT NULL,
	`answerText` text,
	`answerNumber` decimal(10,2),
	`answerJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anamnesis_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `anamnesis_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`category` enum('integrativa','estetica') NOT NULL,
	`conductedById` int,
	`conductedByType` enum('medico','consultora','paciente') DEFAULT 'medico',
	`status` enum('rascunho','em_andamento','concluida') NOT NULL DEFAULT 'rascunho',
	`notes` text,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `anamnesis_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(100) NOT NULL,
	`entity` varchar(100) NOT NULL,
	`entityId` int,
	`details` json,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `consultants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`role` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`isActive` boolean NOT NULL DEFAULT true,
	`canAccessIntegrative` boolean NOT NULL DEFAULT true,
	`canAccessAesthetic` boolean NOT NULL DEFAULT false,
	`canAccessReports` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `consultants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`reportDate` varchar(10) NOT NULL,
	`period` enum('manha','tarde','noite') NOT NULL,
	`sleep` decimal(4,1),
	`energy` decimal(4,1),
	`mood` decimal(4,1),
	`focus` decimal(4,1),
	`concentration` decimal(4,1),
	`libido` decimal(4,1),
	`strength` decimal(4,1),
	`physicalActivity` decimal(4,1),
	`systolicBP` int,
	`diastolicBP` int,
	`weight` decimal(5,1),
	`generalNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`examName` varchar(255) NOT NULL,
	`value` varchar(100),
	`unit` varchar(50),
	`referenceMin` varchar(50),
	`referenceMax` varchar(50),
	`classification` varchar(50),
	`examDate` varchar(10) NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follow_up_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`sessionType` enum('presencial','online') NOT NULL DEFAULT 'presencial',
	`conductedById` int,
	`sessionDate` timestamp NOT NULL,
	`clinicalScore` decimal(5,1),
	`scoreBreakdown` json,
	`notes` text,
	`status` enum('agendada','realizada','cancelada') NOT NULL DEFAULT 'agendada',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follow_up_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`cpf` varchar(14),
	`birthDate` varchar(10),
	`sex` enum('M','F','O'),
	`phone` varchar(20),
	`email` varchar(320),
	`accessToken` varchar(64) NOT NULL,
	`notes` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdById` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `patients_id` PRIMARY KEY(`id`),
	CONSTRAINT `patients_accessToken_unique` UNIQUE(`accessToken`)
);
--> statement-breakpoint
CREATE TABLE `prescription_components` (
	`id` int AUTO_INCREMENT NOT NULL,
	`prescriptionId` int NOT NULL,
	`componentName` varchar(255) NOT NULL,
	`dosage` varchar(100),
	`unit` varchar(20),
	`sortOrder` int NOT NULL DEFAULT 0,
	`notes` text,
	CONSTRAINT `prescription_components_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prescription_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`prescriptionId` int NOT NULL,
	`reportType` enum('reacao_adversa','melhora','sem_efeito','duvida','outro') NOT NULL,
	`severity` enum('leve','moderada','grave') NOT NULL DEFAULT 'leve',
	`description` text NOT NULL,
	`reportedAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	`resolvedById` int,
	`resolutionNotes` text,
	`status` enum('aberto','em_analise','resolvido') NOT NULL DEFAULT 'aberto',
	CONSTRAINT `prescription_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`patientId` int NOT NULL,
	`code` varchar(50) NOT NULL,
	`name` varchar(255) NOT NULL,
	`via` varchar(50),
	`form` varchar(50),
	`dosage` varchar(100),
	`frequency` varchar(100),
	`duration` varchar(50),
	`objective` text,
	`status` enum('ativa','pausada','encerrada') NOT NULL DEFAULT 'ativa',
	`prescribedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prescriptions_id` PRIMARY KEY(`id`)
);
