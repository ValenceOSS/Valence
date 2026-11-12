import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { artworkRevisionOf } from '@ValenceServer/library/artworkRevisionOf';
import { readGenres } from '@ValenceServer/library/readGenres';
import type { SUMMARY_COLUMNS } from '@ValenceServer/library/SUMMARY_COLUMNS';
import type { mediaItem } from '#dialect/Schema';
import type { ArtworkAddressOf } from '@ValenceServer/images/ArtworkAddressOf';

type SummaryRow = Pick<
  typeof mediaItem.$inferSelect,
  Exclude<keyof typeof SUMMARY_COLUMNS, 'titleBackdropUrl'>
> & { titleBackdropUrl?: string | null };

const MainAudioSchema = z
  .array(
    z.object({
      codec: z.string(),
      channels: z.number(),
      isDefault: z.boolean().optional(),
      isAtmos: z.boolean().optional(),
    }),
  )
  .catch([]);

/**
 * The track a file plays by default, in a few words: its codec, how many channels and whether it
 * carries Atmos.
 *
 * @param streams - The file's audio streams, as stored.
 * @returns The main track, or nothing where the file has none.
 */
const mainAudioOf = (streams: SummaryRow['audioStreams']) => {
  const read = MainAudioSchema.parse(streams);
  const main = read.find((one) => one.isDefault === true) ?? read[0];

  return main === undefined
    ? null
    : { codec: main.codec, channels: main.channels, isAtmos: main.isAtmos === true };
};

/**
 * Where each of an item's pictures is served by name, for those it has, so a card can ask for one
 * straight from where it is kept rather than being sent there. The title's backdrop is the one
 * chosen for a programme as a whole where there is one, and otherwise the item's own.
 *
 * @param urls - The item's pictures.
 * @param addressOf - Where a picture is served by name, where the server names its pictures.
 * @returns Each picture's address, or nothing where the server does not name them.
 */
const artworkOf = (
  urls: {
    poster: string | null;
    backdrop: string | null;
    titleBackdrop: string | null;
    logo: string | null;
  },
  addressOf: ArtworkAddressOf | undefined,
) =>
  addressOf === undefined
    ? {}
    : {
        artwork: Object.fromEntries(
          Object.entries(urls).flatMap(([kind, url]) => {
            const address = url === null ? null : addressOf(url);

            return address === null ? [] : [[kind, address]];
          }),
        ),
      };

/**
 * Turns a row read with the summary columns into the summary a client lists it by: its artwork as
 * whether it has each picture, and where each is served by name, and its genres read through a
 * schema.
 *
 * @param row - The row, with any further columns the caller read beside the summary's.
 * @param addressOf - Where a picture is served by name, where the server names its pictures.
 * @returns The summary, carrying those further columns as they were.
 */
const summaryOfRow = <Row extends SummaryRow>(
  {
    posterUrl,
    backdropUrl,
    titleBackdropUrl,
    logoUrl,
    genres,
    artworkChangedAt,
    audioStreams,
    ...row
  }: Row,
  addressOf?: ArtworkAddressOf,
) => ({
  ...row,
  ...artworkOf(
    {
      poster: posterUrl,
      backdrop: backdropUrl,
      titleBackdrop: titleBackdropUrl ?? backdropUrl,
      logo: logoUrl,
    },
    addressOf,
  ),
  audio: mainAudioOf(audioStreams),
  ...artworkRevisionOf(artworkChangedAt),
  addedAt: row.addedAt.toISOString(),
  hasPoster: posterUrl !== null,
  posterUrl,
  hasBackdrop: backdropUrl !== null,
  hasLogo: logoUrl !== null,
  genres: readGenres(JsonValueSchema.parse(genres ?? null)),
});

export type { SummaryRow };

export { summaryOfRow };
