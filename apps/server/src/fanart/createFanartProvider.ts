import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { ArtworkOption } from '@ValenceContracts/schemas/ArtworkChoice';
import type { MetadataProvider } from '@ValenceServer/library/MetadataProvider';

const BASE = 'https://webservice.fanart.tv/v3';

const ImageSchema = z.object({
  url: z.string().url(),
  lang: z.string().catch(''),
  likes: z.coerce.number().int().nonnegative().catch(0),
});

const ImagesSchema = z.array(ImageSchema).catch([]);

const MovieSchema = z.object({
  hdmovielogo: ImagesSchema.default([]),
  movieposter: ImagesSchema.default([]),
  moviebackground: ImagesSchema.default([]),
});

const ShowSchema = z.object({
  hdtvlogo: ImagesSchema.default([]),
  tvposter: ImagesSchema.default([]),
  showbackground: ImagesSchema.default([]),
});

const SIZES = {
  poster: { width: 1000, height: 1426 },
  backdrop: { width: 1920, height: 1080 },
  logo: { width: 800, height: 310 },
} as const;

type Fetcher = (url: string) => Promise<{ ok: boolean; json: () => Promise<JsonValue> }>;

/**
 * Turns fanart.tv's pictures of one kind into the choices an administrator picks from, the most
 * liked first, its small preview beside each and a picture with no lettering marked as such.
 *
 * @param images - What fanart.tv has.
 * @param kind - Which kind they are.
 * @returns The choices.
 */
const optionsOf = (
  images: readonly z.infer<typeof ImageSchema>[],
  kind: keyof typeof SIZES,
): ArtworkOption[] =>
  [...images]
    .sort((one, other) => other.likes - one.likes)
    .map((image) => ({
      url: image.url,
      previewUrl: image.url.replace('/fanart/', '/preview/'),
      language: image.lang === '' || image.lang === '00' ? null : image.lang,
      ...SIZES[kind],
      votes: image.likes,
      source: 'fanart' as const,
    }));

/**
 * fanart.tv as a second source of a title's posters, backgrounds and logos, beside the catalogue's,
 * once an administrator gives a key: it describes nothing, so it never decides what a file is.
 *
 * @param options - How to read the key, and how to fetch.
 * @returns The provider.
 */
const createFanartProvider = ({
  readApiKey,
  fetchImpl = async (url) => {
    const response = await fetch(url);

    return {
      ok: response.ok,
      json: async () => JsonValueSchema.parse(await response.json()),
    };
  },
}: {
  readApiKey: () => Promise<string>;
  fetchImpl?: Fetcher;
}): MetadataProvider => ({
  name: 'fanart.tv',
  describe: () => Promise.resolve(null),
  readArtworkOptions: async ({ externalId, isSeries, tvdbId }) => {
    const key = (await readApiKey()).trim();
    const id = isSeries ? (tvdbId ?? null) : externalId;

    if (key === '' || id === null) {
      return null;
    }

    const response = await fetchImpl(
      `${BASE}/${isSeries ? 'tv' : 'movies'}/${encodeURIComponent(id)}?api_key=${encodeURIComponent(key)}`,
    ).catch(() => null);

    if (response === null || !response.ok) {
      return null;
    }

    const body = await response.json().catch(() => null);

    if (isSeries) {
      const read = ShowSchema.safeParse(body);

      return read.success
        ? {
            poster: optionsOf(read.data.tvposter, 'poster'),
            backdrop: optionsOf(read.data.showbackground, 'backdrop'),
            logo: optionsOf(read.data.hdtvlogo, 'logo'),
          }
        : null;
    }

    const read = MovieSchema.safeParse(body);

    return read.success
      ? {
          poster: optionsOf(read.data.movieposter, 'poster'),
          backdrop: optionsOf(read.data.moviebackground, 'backdrop'),
          logo: optionsOf(read.data.hdmovielogo, 'logo'),
        }
      : null;
  },
});

export { createFanartProvider };
