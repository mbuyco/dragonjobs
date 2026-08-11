CREATE TABLE `job_sources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`base_url` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `job_sources_name_unique` ON `job_sources` (`name`);--> statement-breakpoint
CREATE TABLE `job_tags` (
	`job_id` text NOT NULL,
	`tag` text NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `job_tags_pk` ON `job_tags` (`job_id`,`tag`);--> statement-breakpoint
CREATE INDEX `idx_job_tags_tag` ON `job_tags` (`tag`);--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` integer NOT NULL,
	`external_id` text NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`location` text,
	`salary` text,
	`salary_min` real,
	`salary_max` real,
	`currency` text,
	`work_arrangement` text,
	`description` text,
	`apply_url` text NOT NULL,
	`posted_at` text,
	`fetched_at` text DEFAULT (datetime('now')) NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`raw_payload` text NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `job_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_source_external_uidx` ON `jobs` (`source_id`,`external_id`);--> statement-breakpoint
CREATE INDEX `idx_jobs_posted_at` ON `jobs` (`posted_at`);--> statement-breakpoint
CREATE INDEX `idx_jobs_is_active` ON `jobs` (`is_active`);