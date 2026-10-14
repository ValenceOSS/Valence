import { z } from 'zod';
import { ReleaseSchema } from './Indexer';

const COUR_SOURCES = ['seasons', 'group', 'anilist'] as const;

const CourSourceSchema = z.enum(COUR_SOURCES);

const ANIME_NUMBERINGS = ['aired', 'perCour', 'absolute'] as const;

const AnimeNumberingSchema = z.enum(ANIME_NUMBERINGS);

const EpisodeGroupIdSchema = z.string().regex(/^[0-9a-f]{24}$/);

const COUR_ORDER_CHOICES = ['auto', 'seasons', 'anilist'] as const;

const CourOrderSchema = z.union([
  z.enum(COUR_ORDER_CHOICES),
  z.string().regex(/^group:[0-9a-f]{24}$/),
]);

const AnimeEpisodeSchema = z.object({
  season: z.number().int().nonnegative(),
  episode: z.number().int().nonnegative(),
  absolute: z.number().int().positive().nullable(),
  cour: z.number().int().nonnegative(),
});

const AnimeCourSchema = z.object({
  cour: z.number().int().positive(),
  name: z.string().min(1).nullable(),
  names: z.array(z.string().min(1)).max(20).default([]),
  anilistId: z.number().int().positive().nullable(),
  malId: z.number().int().positive().nullable(),
  season: z.number().int().nonnegative().nullable(),
  firstAired: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  episodeCount: z.number().int().nonnegative(),
});

const AnimeNamesSchema = z.object({
  english: z.string().min(1).nullable(),
  romaji: z.string().min(1).nullable(),
  native: z.string().min(1).nullable(),
  others: z.array(z.string().min(1)).max(20).default([]),
});

const EpisodeGroupChoiceSchema = z.object({
  id: EpisodeGroupIdSchema,
  name: z.string(),
  groupCount: z.number().int().nonnegative(),
});

const AnimeFilmSchema = z.object({
  anilistId: z.number().int().positive(),
  title: z.string().min(1),
  year: z.number().int().nullable(),
  tmdbId: z.number().int().positive().nullable(),
});

const AnimeFactsSchema = z.object({
  anilistId: z.number().int().positive().nullable(),
  malId: z.number().int().positive().nullable(),
  names: AnimeNamesSchema,
  cours: z.array(AnimeCourSchema).max(200),
  episodes: z.array(AnimeEpisodeSchema).max(5000),
  courSource: CourSourceSchema,
  groupId: EpisodeGroupIdSchema.nullable().default(null),
  groups: z.array(EpisodeGroupChoiceSchema).max(50).default([]),
  films: z.array(AnimeFilmSchema).max(50).default([]),
});

const AnimeQuestionReadingSchema = z.object({
  numbering: AnimeNumberingSchema,
  episodes: z
    .array(z.object({ season: z.number().int().nonnegative(), episode: z.number().int() }))
    .max(5000),
});

const AnimeQuestionSchema = z.object({
  id: z.string().uuid(),
  release: ReleaseSchema,
  group: z.string().nullable(),
  readings: z.array(AnimeQuestionReadingSchema).min(2).max(4),
  guess: AnimeNumberingSchema,
  at: z.string().datetime(),
});

const AnimeAnswerSchema = z.object({
  numbering: AnimeNumberingSchema,
  isRemembered: z.boolean().default(false),
});

type CourSource = (typeof COUR_SOURCES)[number];
type AnimeNumbering = (typeof ANIME_NUMBERINGS)[number];
type CourOrder = z.infer<typeof CourOrderSchema>;
type AnimeEpisode = z.infer<typeof AnimeEpisodeSchema>;
type AnimeCour = z.infer<typeof AnimeCourSchema>;
type AnimeNames = z.infer<typeof AnimeNamesSchema>;
type EpisodeGroupChoice = z.infer<typeof EpisodeGroupChoiceSchema>;
type AnimeFilm = z.infer<typeof AnimeFilmSchema>;
type AnimeFacts = z.infer<typeof AnimeFactsSchema>;
type AnimeQuestionReading = z.infer<typeof AnimeQuestionReadingSchema>;
type AnimeQuestion = z.infer<typeof AnimeQuestionSchema>;
type AnimeAnswer = z.input<typeof AnimeAnswerSchema>;

export type {
  AnimeAnswer,
  AnimeCour,
  AnimeEpisode,
  AnimeFacts,
  AnimeFilm,
  AnimeNames,
  AnimeNumbering,
  AnimeQuestion,
  AnimeQuestionReading,
  CourOrder,
  CourSource,
  EpisodeGroupChoice,
};

export {
  ANIME_NUMBERINGS,
  COUR_ORDER_CHOICES,
  COUR_SOURCES,
  AnimeAnswerSchema,
  AnimeCourSchema,
  AnimeEpisodeSchema,
  AnimeFactsSchema,
  AnimeFilmSchema,
  AnimeNamesSchema,
  AnimeNumberingSchema,
  AnimeQuestionReadingSchema,
  AnimeQuestionSchema,
  CourOrderSchema,
  CourSourceSchema,
  EpisodeGroupChoiceSchema,
  EpisodeGroupIdSchema,
};
