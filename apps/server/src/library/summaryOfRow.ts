import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { artworkRevisionOf } from '@ValenceServer/library/artworkRevisionOf';
import { readGenres } from '@ValenceServer/library/readGenres';
import type { SUMMARY_COLUMNS } from '@ValenceServer/library/SUMMARY_COLUMNS';
import type { mediaItem } from '#dialect/Schema';

type SummaryRow = Pick<typeof mediaItem.$inferSelect, keyof typeof SUMMARY_COLUMNS>;

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
  ...row
}: Row) => ({
  ...row,
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
