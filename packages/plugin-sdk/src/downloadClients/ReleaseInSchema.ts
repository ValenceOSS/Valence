import { z } from 'zod';
import { InfoHashSchema } from '@ValenceSDK/remoteFiles/InfoHashSchema';

const TitleSchema = z.string().min(1).max(500);

const MOST_BASE64_CHARACTERS = 14_000_000;

const ReleaseInSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('magnet'),
    title: TitleSchema,
    magnet: z.string().max(10_000).startsWith('magnet:'),
    infoHash: InfoHashSchema.nullable(),
  }),
  z.object({
    kind: z.literal('torrent'),
    title: TitleSchema,
    torrentBase64: z.base64().max(MOST_BASE64_CHARACTERS),
    infoHash: InfoHashSchema.nullable(),
  }),
  z.object({
    kind: z.literal('nzb'),
    title: TitleSchema,
    nzbBase64: z.base64().max(MOST_BASE64_CHARACTERS),
  }),
]);

type ReleaseIn = z.infer<typeof ReleaseInSchema>;

export type { ReleaseIn };

export { ReleaseInSchema };
