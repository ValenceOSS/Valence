import { z } from 'zod';

const JOB_RUN_STATUSES = ['queued', 'running', 'completed', 'failed'] as const;

const JOB_RUN_KEPT_FOR_DAYS = 30;

const JobRunStatusSchema = z.enum(JOB_RUN_STATUSES);

const JobRunProgressSchema = z.object({
  phase: z.string(),
  processed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

const JobRunRecordSchema = z.object({
  id: z.string(),
  kind: z.string(),
  status: JobRunStatusSchema,
  subject: z.string().nullable(),
  startedAtMs: z.number().int().nonnegative().nullable(),
  finishedAtMs: z.number().int().nonnegative().nullable(),
  progress: JobRunProgressSchema.nullable(),
  errorMessage: z.string().nullable(),
  createdAtMs: z.number().int().nonnegative(),
});

const JobRunIssueSchema = z.object({
  id: z.string(),
  jobRunId: z.string(),
  path: z.string(),
  reason: z.string(),
  atMs: z.number().int().nonnegative(),
});

const JobRunPageSchema = z.object({
  records: z.array(JobRunRecordSchema),
  total: z.number().int().nonnegative(),
});

const JobRunQuerySchema = z.object({
  kind: z.string().nullable().default(null),
  status: JobRunStatusSchema.nullable().default(null),
  search: z.string().default(''),
  sinceMs: z.number().int().nonnegative().nullable().default(null),
  limit: z.number().int().positive().max(1000).default(200),
});

const JobStartedEventSchema = z.object({
  event: z.literal('started'),
  kind: z.string(),
  jobId: z.string(),
  subject: z.string().nullable(),
});

const JobProgressEventSchema = z.object({
  event: z.literal('progress'),
  jobId: z.string(),
  phase: z.string(),
  processed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  item: z.string().nullable().default(null),
});

const JobCompletedEventSchema = z.object({
  event: z.literal('completed'),
  kind: z.string(),
  label: z.string(),
  jobId: z.string(),
  subject: z.string().nullable(),
  subjectName: z.string().nullable(),
});

const JobFailedEventSchema = z.object({
  event: z.literal('failed'),
  kind: z.string(),
  label: z.string(),
  jobId: z.string(),
  subject: z.string().nullable(),
  subjectName: z.string().nullable(),
  reason: z.string(),
});

const JobEventSchema = z.discriminatedUnion('event', [
  JobStartedEventSchema,
  JobProgressEventSchema,
  JobCompletedEventSchema,
  JobFailedEventSchema,
]);

type JobRunStatus = z.infer<typeof JobRunStatusSchema>;
type JobRunProgress = z.infer<typeof JobRunProgressSchema>;
type JobRunRecord = z.infer<typeof JobRunRecordSchema>;
type JobRunIssue = z.infer<typeof JobRunIssueSchema>;
type JobRunPage = z.infer<typeof JobRunPageSchema>;
type JobRunQuery = z.infer<typeof JobRunQuerySchema>;
type JobEvent = z.infer<typeof JobEventSchema>;

export type {
  JobRunStatus,
  JobRunProgress,
  JobRunRecord,
  JobRunIssue,
  JobRunPage,
  JobRunQuery,
  JobEvent,
};

export {
  JOB_RUN_STATUSES,
  JOB_RUN_KEPT_FOR_DAYS,
  JobRunStatusSchema,
  JobRunProgressSchema,
  JobRunRecordSchema,
  JobRunIssueSchema,
  JobRunPageSchema,
  JobRunQuerySchema,
  JobEventSchema,
};
