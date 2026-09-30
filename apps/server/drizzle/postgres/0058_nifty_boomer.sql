CREATE TABLE "job_run" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"status" text NOT NULL,
	"subject" text,
	"startedAt" timestamp,
	"finishedAt" timestamp,
	"progress" jsonb,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_run_issue" (
	"id" text PRIMARY KEY NOT NULL,
	"jobRunId" text NOT NULL,
	"path" text NOT NULL,
	"reason" text NOT NULL,
	"atMs" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_sample" (
	"id" text PRIMARY KEY NOT NULL,
	"atMs" bigint NOT NULL,
	"systemCpuPercent" real NOT NULL,
	"loadAverage" real NOT NULL,
	"systemMemoryUsedBytes" bigint NOT NULL,
	"systemMemoryTotalBytes" bigint NOT NULL,
	"cpuCount" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_run_issue" ADD CONSTRAINT "job_run_issue_jobRunId_job_run_id_fk" FOREIGN KEY ("jobRunId") REFERENCES "public"."job_run"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_run_kind_idx" ON "job_run" USING btree ("kind","createdAt");--> statement-breakpoint
CREATE INDEX "job_run_status_idx" ON "job_run" USING btree ("status","createdAt");--> statement-breakpoint
CREATE INDEX "job_run_issue_run_idx" ON "job_run_issue" USING btree ("jobRunId");--> statement-breakpoint
CREATE INDEX "resource_sample_at_idx" ON "resource_sample" USING btree ("atMs");