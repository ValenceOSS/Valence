import { z } from 'zod';

const MusicBrainzReleaseSchema = z.object({
  id: z.string(),
  'release-group': z.object({ id: z.string() }).nullable().catch(null),
  media: z
    .array(
      z.object({
        'track-count': z.number().int().nonnegative().catch(0),
        tracks: z
          .array(
            z.object({
              title: z.string().catch(''),
              length: z.number().nonnegative().nullable().catch(null),
              recording: z.object({ id: z.string() }).nullable().catch(null),
            }),
          )
          .catch([]),
      }),
    )
    .catch([]),
});

const MusicBrainzReleasePageSchema = z.object({
  'release-count': z.number().int().nonnegative(),
  releases: z.array(MusicBrainzReleaseSchema.nullable().catch(null)).catch([]),
});

type MusicBrainzRelease = z.infer<typeof MusicBrainzReleaseSchema>;

export type { MusicBrainzRelease };

export { MusicBrainzReleasePageSchema };
