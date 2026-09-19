import { z } from 'zod';

const MusicBrainzReleaseGroupSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  'primary-type': z.string().nullable().catch(null),
  'secondary-types': z.array(z.string()).catch([]),
  'first-release-date': z.string().catch(''),
  disambiguation: z.string().catch(''),
  'artist-credit': z
    .array(z.object({ name: z.string(), joinphrase: z.string().catch('') }))
    .catch([]),
});

type MusicBrainzReleaseGroup = z.infer<typeof MusicBrainzReleaseGroupSchema>;

export type { MusicBrainzReleaseGroup };

export { MusicBrainzReleaseGroupSchema };
