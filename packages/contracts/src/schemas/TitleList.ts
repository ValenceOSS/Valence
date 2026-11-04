import { z } from 'zod';
import { MediaSummarySchema } from './Library';

const TitleRowSchema = z.object({
  key: z.string(),
  kind: z.enum(['film', 'show']),
  libraryId: z.string(),
  leadId: z.string(),
  title: z.string(),
  year: z.number().int().nullable(),
  files: z.number().int().nonnegative(),
  seasons: z.number().int().nonnegative(),
  sizeBytes: z.number().nonnegative(),
  latestAddedAt: z.string(),
  isMatched: z.boolean(),
  hasPoster: z.boolean(),
});

const TitlePageSchema = z.object({
  titles: z.array(TitleRowSchema),
  next: z.string().nullable(),
});

const TitleFilesSchema = z.object({ files: z.array(MediaSummarySchema) });

const TitleValuesSchema = z.object({
  values: z.array(z.object({ value: z.string(), count: z.number().int().positive() })),
});

const TitleCandidatesSchema = z.object({
  matches: z.array(
    z.object({
      externalId: z.string(),
      kind: z.enum(['tv', 'movie']),
      title: z.string(),
      year: z.number().int().nullable(),
      overview: z.string().nullable(),
      posterUrl: z.string().nullable(),
    }),
  ),
  hasMore: z.boolean(),
  total: z.number().int().nonnegative(),
});

const TITLE_VALUE_FIELDS = ['genres', 'tags', 'studios', 'networks'] as const;

type TitleRow = z.infer<typeof TitleRowSchema>;
type TitlePage = z.infer<typeof TitlePageSchema>;
type TitleFiles = z.infer<typeof TitleFilesSchema>;
type TitleValues = z.infer<typeof TitleValuesSchema>;
type TitleValueField = (typeof TITLE_VALUE_FIELDS)[number];
type TitleCandidates = z.infer<typeof TitleCandidatesSchema>;

export type { TitleRow, TitlePage, TitleFiles, TitleValues, TitleValueField, TitleCandidates };

export {
  TITLE_VALUE_FIELDS,
  TitleRowSchema,
  TitlePageSchema,
  TitleFilesSchema,
  TitleValuesSchema,
  TitleCandidatesSchema,
};
