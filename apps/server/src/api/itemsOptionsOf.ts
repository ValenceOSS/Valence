import { DEFAULT_LIMIT } from '@ValenceServer/library/LibraryService';
import type { ListItemsOptions } from '@ValenceServer/library/LibraryService';
import type { ItemsQuery } from '@ValenceServer/routes/LibraryRoute';
import type { z } from '@hono/zod-openapi';
import { OCCASIONS } from '@ValenceContracts/constants/OCCASIONS';
import type { Occasion } from '@ValenceContracts/constants/OCCASIONS';

/**
 * Splits a comma-separated list asked for in a query, leaving out empty entries.
 *
 * @param value - The list as asked for, if it was.
 * @returns Its entries.
 */
const listed = (value: string | undefined): string[] =>
  value === undefined ? [] : value.split(',').filter((one) => one.trim() !== '');

/**
 * Reads the occasions asked for, leaving out any this server does not know.
 *
 * @param value - The comma-separated list as asked for, if it was.
 * @returns The occasions.
 */
const occasionsIn = (value: string | undefined): Occasion[] =>
  listed(value).flatMap((asked) => OCCASIONS.filter((known) => known === asked));

/**
 * Turns what a request for library items asked for into what the library service reads.
 *
 * @param query - The query as the route read it.
 * @param profileId - The profile asking, where one is.
 * @returns The options to list items with.
 */
const itemsOptionsOf = (
  query: z.infer<typeof ItemsQuery>,
  profileId: string | null,
): ListItemsOptions => {
  const { search, kind, genre, yearFrom, yearTo, minRating, ids, order, limit, offset } = query;
  const { minYourStars, versions, shows, genres, decades, occasions } = query;
  const { audioLanguages, audioCodecs, audioChannels } = query;

  return {
    ...(search === undefined ? {} : { search }),
    ...(kind === undefined ? {} : { kind }),
    ...(genre === undefined ? {} : { genre }),
    ...(listed(genres).length === 0 ? {} : { genres: listed(genres) }),
    ...(listed(decades).length === 0
      ? {}
      : {
          decades: listed(decades)
            .map(Number)
            .filter((decade) => Number.isInteger(decade)),
        }),
    ...(occasionsIn(occasions).length === 0 ? {} : { occasions: occasionsIn(occasions) }),
    ...(listed(audioLanguages).length === 0 &&
    listed(audioCodecs).length === 0 &&
    listed(audioChannels).length === 0
      ? {}
      : {
          audio: {
            languages: listed(audioLanguages),
            codecs: listed(audioCodecs),
            channels: listed(audioChannels)
              .map(Number)
              .filter((count) => Number.isInteger(count) && count > 0),
          },
        }),
    ...(yearFrom === undefined ? {} : { yearFrom }),
    ...(yearTo === undefined ? {} : { yearTo }),
    ...(minRating === undefined ? {} : { minRating }),
    ...(ids === undefined ? {} : { ids: listed(ids) }),
    ...(order === undefined ? {} : { order }),
    ...(profileId === null ? {} : { profileId }),
    ...(minYourStars === undefined ? {} : { minYourStars }),
    ...(versions === 'all' ? { withVersions: true } : {}),
    ...(shows === 'once' ? { showsOnce: true } : {}),
    limit: limit ?? DEFAULT_LIMIT,
    offset: offset ?? 0,
  };
};

export { itemsOptionsOf };
