import { z } from 'zod';

const ARTWORK_KINDS = ['poster', 'backdrop', 'logo'] as const;

const ArtworkKindSchema = z.enum(ARTWORK_KINDS);

const ArtworkOptionSchema = z.object({
  url: z.string().url(),
  previewUrl: z.string().url(),
  language: z.string().nullable(),
  width: z.number().int().nonnegative(),
  height: z.number().int().nonnegative(),
  votes: z.number().int().nonnegative(),
});

const ArtworkChoicesSchema = z.object({
  kind: z.enum(['movie', 'tv']),
  options: z.object({
    poster: z.array(ArtworkOptionSchema),
    backdrop: z.array(ArtworkOptionSchema),
    logo: z.array(ArtworkOptionSchema),
  }),
  chosen: z.object({
    poster: z.string().nullable(),
    backdrop: z.string().nullable(),
    logo: z.string().nullable(),
  }),
});

const ChooseArtworkSchema = z.object({ url: z.string().url() });

type ArtworkKind = z.infer<typeof ArtworkKindSchema>;

type ArtworkOption = z.infer<typeof ArtworkOptionSchema>;

type ArtworkChoices = z.infer<typeof ArtworkChoicesSchema>;

export type { ArtworkChoices, ArtworkKind, ArtworkOption };

export {
  ARTWORK_KINDS,
  ArtworkChoicesSchema,
  ArtworkKindSchema,
  ArtworkOptionSchema,
  ChooseArtworkSchema,
};
