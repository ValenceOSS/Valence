CREATE TABLE "job_schedule" (
	"queueName" text NOT NULL,
	"key" text NOT NULL,
	"cron" text NOT NULL,
	"timezone" text NOT NULL,
	"nextRunAt" timestamp NOT NULL,
	CONSTRAINT "job_schedule_queueName_key_pk" PRIMARY KEY("queueName","key")
);
--> statement-breakpoint
CREATE TABLE "queued_job" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"subject" text,
	"state" text NOT NULL,
	"waitingKey" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"retryLimit" integer NOT NULL,
	"lastError" text,
	"runAfter" timestamp NOT NULL,
	"finishedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "queued_job_waiting_key_idx" ON "queued_job" USING btree ("kind","waitingKey");--> statement-breakpoint
CREATE INDEX "queued_job_next_idx" ON "queued_job" USING btree ("kind","state","runAfter");--> statement-breakpoint
CREATE INDEX "queued_job_subject_idx" ON "queued_job" USING btree ("subject","state");--> statement-breakpoint
CREATE INDEX "queued_job_finished_idx" ON "queued_job" USING btree ("state","finishedAt");--> statement-breakpoint
-- Work that was waiting in pg-boss when the server was updated moves across rather than being lost.
-- A database made after pg-boss left has no valence_jobs schema, and this does nothing. What pg-boss
-- had running or finished is not carried: job_run already keeps the history, and schedules are
-- rebuilt from job_trigger at start-up, which is also why a waiting firing of a schedule is left.
-- The schema itself stays for one release, so going back to the version before this still works.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'valence_jobs' AND table_name = 'job'
  ) THEN
    INSERT INTO "queued_job" (
      "id", "kind", "payload", "subject", "state", "waitingKey", "attempts", "retryLimit", "runAfter", "createdAt"
    )
    SELECT
      id::text,
      name,
      coalesce(data, '{}'::jsonb),
      coalesce(data->>'libraryId', data->>'subject'),
      'queued',
      singleton_key,
      retry_count,
      retry_limit,
      start_after AT TIME ZONE 'UTC',
      created_on AT TIME ZONE 'UTC'
    FROM valence_jobs.job
    WHERE state::text IN ('created', 'retry') AND name NOT LIKE '%.scheduled'
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
