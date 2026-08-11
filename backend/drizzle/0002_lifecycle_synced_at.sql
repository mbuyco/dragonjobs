DROP INDEX `idx_jobs_is_active`;--> statement-breakpoint
ALTER TABLE `jobs` RENAME COLUMN `fetched_at` TO `synced_at`;--> statement-breakpoint
ALTER TABLE `jobs` DROP COLUMN `is_active`;--> statement-breakpoint
CREATE INDEX `idx_jobs_synced_at` ON `jobs` (`synced_at`);
