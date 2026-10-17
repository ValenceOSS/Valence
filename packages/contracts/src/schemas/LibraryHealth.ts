import { z } from 'zod';

const HEALTH_PROBLEMS = ['unmatched', 'noArtwork', 'duplicate', 'unreadable'] as const;

const HealthProblemSchema = z.enum(HEALTH_PROBLEMS);

const HealthItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number().int().nullable(),
  libraryId: z.string(),
  libraryName: z.string(),
  path: z.string(),
  group: z.string().nullable(),
});

const HealthListSchema = z.object({
  total: z.number().int().nonnegative(),
  items: z.array(HealthItemSchema),
});

const LibraryHealthSchema = z.object({
  checkedAt: z.string().datetime(),
  unmatched: HealthListSchema,
  noArtwork: HealthListSchema,
  duplicate: HealthListSchema,
  unreadable: HealthListSchema,
});

type HealthProblem = z.infer<typeof HealthProblemSchema>;
type HealthItem = z.infer<typeof HealthItemSchema>;
type HealthList = z.infer<typeof HealthListSchema>;
type LibraryHealth = z.infer<typeof LibraryHealthSchema>;

export type { HealthItem, HealthList, HealthProblem, LibraryHealth };

export {
  HEALTH_PROBLEMS,
  HealthItemSchema,
  HealthListSchema,
  HealthProblemSchema,
  LibraryHealthSchema,
};
