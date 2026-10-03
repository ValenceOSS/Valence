import { z } from 'zod';

const MOST_NOTE_CHARACTERS = 200;

const LeftOutSchema = z.object({
  id: z.string().min(1),
  libraryId: z.string().min(1),
  path: z.string().min(1),
  isFolder: z.boolean(),
  note: z.string().nullable(),
  createdAt: z.string().datetime(),
  createdBy: z.string().nullable(),
});

const LeftOutChangeSchema = z.object({ leftOut: LeftOutSchema, jobId: z.string().nullable() });

const LeaveOutRequestSchema = z.object({
  path: z.string().trim().min(1),
  note: z.string().trim().max(MOST_NOTE_CHARACTERS).nullable().default(null),
});

type LeftOut = z.infer<typeof LeftOutSchema>;
type LeaveOutRequest = z.infer<typeof LeaveOutRequestSchema>;
type LeftOutChange = z.infer<typeof LeftOutChangeSchema>;

export type { LeaveOutRequest, LeftOut, LeftOutChange };

export { LeaveOutRequestSchema, LeftOutChangeSchema, LeftOutSchema, MOST_NOTE_CHARACTERS };
