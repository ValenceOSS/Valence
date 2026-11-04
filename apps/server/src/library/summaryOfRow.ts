import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { artworkRevisionOf } from '@ValenceServer/library/artworkRevisionOf';
import { readGenres } from '@ValenceServer/library/readGenres';
import type { SUMMARY_COLUMNS } from '@ValenceServer/library/SUMMARY_COLUMNS';
import type { mediaItem } from '#dialect/Schema';

type SummaryRow = Pick<typeof mediaItem.$inferSelect, keyof typeof SUMMARY_COLUMNS>;

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
 * Turns a row read with the summary columns into the summary a client lists it by: its artwork as
 * whether it has each picture, and its genres read through a schema.
 *
 * @param row - The row, with any further columns the caller read beside the summary's.
 * @returns The summary, carrying those further columns as they were.
 */
const summaryOfRow = <Row extends SummaryRow>({
  posterUrl,
  backdropUrl,
  logoUrl,
  genres,
  artworkChangedAt,
  audioStreams,
  ...row
}: Row) => ({
  ...row,
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
