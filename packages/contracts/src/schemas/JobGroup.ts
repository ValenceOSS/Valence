import { z } from 'zod';

const JOB_GROUPS = [
  'library',
  'requests',
  'notifications',
  'health',
  'housekeeping',
  'reset',
] as const;

const JobGroupSchema = z.enum(JOB_GROUPS);

type JobGroup = z.infer<typeof JobGroupSchema>;

export type { JobGroup };

export { JOB_GROUPS, JobGroupSchema };
