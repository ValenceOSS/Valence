import { z } from 'zod';
import { BookChapterSchema, BookSchema } from '@ValenceContracts/schemas/Book';
import { HeldStateSchema } from '@ValenceContracts/schemas/HeldFile';
import { AudioQualitySchema, MusicTrackSchema } from '@ValenceContracts/schemas/Music';

const KEPT_LISTENING_KINDS = ['album', 'playlist', 'liked', 'audiobook'] as const;

const KeptListeningKindSchema = z.enum(KEPT_LISTENING_KINDS);

const KeptListeningSchema = z.object({
  kind: KeptListeningKindSchema,
  id: z.string().min(1),
  title: z.string().min(1),
  byline: z.string().nullable().default(null),
  artworkFrom: z.string().nullable().default(null),
  quality: AudioQualitySchema.nullable().default(null),
  tracks: z.array(MusicTrackSchema).default([]),
  book: BookSchema.nullable().default(null),
  chapters: z.array(BookChapterSchema).default([]),
  server: z.string().nullable().default(null),
  profileId: z.string().nullable().default(null),
  keptAt: z.string().datetime(),
});

const KeptListeningFileSchema = z.object({
  name: z.string().regex(/^[a-z0-9][a-z0-9.-]*$/u),
  from: z.string().startsWith('/api/'),
  state: HeldStateSchema,
  bytes: z.number().int().nonnegative().default(0),
  ofBytes: z.number().int().nonnegative().nullable().default(null),
  failure: z.string().nullable().default(null),
});

const KeptListeningShelfSchema = z.object({
  kept: z.array(KeptListeningSchema).default([]),
  files: z.array(KeptListeningFileSchema).default([]),
});

type KeptListeningKind = z.infer<typeof KeptListeningKindSchema>;
type KeptListening = z.infer<typeof KeptListeningSchema>;
type KeptListeningFile = z.infer<typeof KeptListeningFileSchema>;
type KeptListeningShelf = z.infer<typeof KeptListeningShelfSchema>;

export type { KeptListening, KeptListeningFile, KeptListeningKind, KeptListeningShelf };

export {
  KEPT_LISTENING_KINDS,
  KeptListeningFileSchema,
  KeptListeningKindSchema,
  KeptListeningSchema,
  KeptListeningShelfSchema,
};
