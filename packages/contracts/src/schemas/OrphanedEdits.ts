import { z } from 'zod';

const OrphanedEditsSchema = z.object({
  orphans: z.array(
    z.object({
      key: z.string(),
      kind: z.enum(['film', 'show']),
      fields: z.number().int().nonnegative(),
      setAt: z.string(),
      name: z.string().nullable(),
    }),
  ),
});

const AttachOrphanRequestSchema = z.object({
  libraryId: z.string().min(1),
  key: z.string().min(1),
  toId: z.string().min(1),
});

const ForgetOrphanRequestSchema = z.object({
  libraryId: z.string().min(1),
  key: z.string().min(1),
});

const OrphanOutcomeSchema = z.object({ edits: z.number().int().nonnegative() });

type OrphanedEdits = z.infer<typeof OrphanedEditsSchema>;
type AttachOrphanRequest = z.infer<typeof AttachOrphanRequestSchema>;
type ForgetOrphanRequest = z.infer<typeof ForgetOrphanRequestSchema>;
type OrphanOutcome = z.infer<typeof OrphanOutcomeSchema>;

export type { OrphanedEdits, AttachOrphanRequest, ForgetOrphanRequest, OrphanOutcome };

export {
  OrphanedEditsSchema,
  AttachOrphanRequestSchema,
  ForgetOrphanRequestSchema,
  OrphanOutcomeSchema,
};
