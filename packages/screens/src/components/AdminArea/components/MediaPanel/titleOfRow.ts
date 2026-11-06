import type { TitleRow } from '@ValenceContracts/schemas/TitleList';
import type { MediaTitle } from './MediaTitle.types';

/**
 * A row the server listed, as the list draws a title before its files are read: its lead file and
 * the totals the server worked out, with the rows beneath it read only once it is opened.
 *
 * @param row - The row.
 * @returns The title.
 */
const titleOfRow = (row: TitleRow): MediaTitle => ({
  id: row.id,
  libraryId: row.libraryId,
  kind: row.kind === 'show' ? 'series' : 'film',
  name: row.name,
  order: row.order,
  year: row.year,
  lead: row.lead,
  episodes: [],
  parts: [],
  seasons: row.seasons,
  sizeBytes: row.sizeBytes,
  addedAt: row.latestAddedAt,
  posterFrom: row.posterFrom,
  isMatched: row.isMatched,
  row,
});

export { titleOfRow };
