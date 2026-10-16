import { z } from 'zod';

const LibraryLockRequestSchema = z.object({
  secret: z.string().min(4).max(200).nullable(),
  relockMinutes: z.number().int().min(5).max(1440).default(60),
});

const LibraryLockSchema = z.object({
  hash: z.string().min(1),
  relockMinutes: z.number().int().min(5).max(1440),
});

const LibraryLocksSchema = z.record(z.string(), LibraryLockSchema);

const LibraryUnlockRequestSchema = z.object({ secret: z.string().min(1).max(200) });

type LibraryLockRequest = z.infer<typeof LibraryLockRequestSchema>;

type LibraryLocks = z.infer<typeof LibraryLocksSchema>;

export type { LibraryLockRequest, LibraryLocks };

export {
  LibraryLockRequestSchema,
  LibraryLockSchema,
  LibraryLocksSchema,
  LibraryUnlockRequestSchema,
};
