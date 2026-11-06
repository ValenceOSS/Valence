import { z } from 'zod';

const PatternRenameStateSchema = z.enum(['ready', 'same', 'taken', 'unmatched', 'parts', 'extra']);

const PatternRenamePlanRequestSchema = z.object({
  mediaIds: z.array(z.string().min(1).max(64)).min(1).max(5000),
});

const PatternRenameRequestSchema = PatternRenamePlanRequestSchema.extend({
  whenTaken: z.enum(['skip', 'number']),
});

const PatternRenamePlanSchema = z.object({
  files: z.array(
    z.object({
      mediaId: z.string(),
      from: z.string(),
      to: z.string(),
      sidecars: z.number().int().nonnegative(),
      state: PatternRenameStateSchema,
    }),
  ),
});

const PatternRenameResultSchema = z.object({
  renamed: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  jobId: z.string().nullable(),
});

type PatternRenameState = z.infer<typeof PatternRenameStateSchema>;
type PatternRenamePlan = z.infer<typeof PatternRenamePlanSchema>;
type PatternRenameResult = z.infer<typeof PatternRenameResultSchema>;

export type { PatternRenamePlan, PatternRenameResult, PatternRenameState };

export {
  PatternRenamePlanRequestSchema,
  PatternRenamePlanSchema,
  PatternRenameRequestSchema,
  PatternRenameResultSchema,
  PatternRenameStateSchema,
};
