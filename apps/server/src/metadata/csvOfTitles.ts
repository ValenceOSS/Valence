import type { TitleRow } from '@ValenceContracts/schemas/TitleList';

const COLUMNS: readonly (readonly [string, (row: TitleRow) => string | number | null])[] = [
  ['kind', (row) => row.kind],
  ['title', (row) => row.name],
  ['sort_title', (row) => row.lead.seriesSortTitle ?? row.lead.sortTitle ?? null],
  ['year', (row) => row.year],
  ['release_date', (row) => row.lead.releaseDate ?? null],
  ['genres', (row) => (row.lead.genres ?? []).join('; ')],
  ['rating', (row) => row.lead.rating ?? null],
  ['tmdb_id', (row) => row.lead.externalId ?? null],
  ['matched', (row) => (row.isMatched ? 'yes' : 'no')],
  ['edited', (row) => (row.isEdited ? 'yes' : 'no')],
  ['seasons', (row) => (row.kind === 'show' ? row.seasons : null)],
  ['episodes', (row) => (row.kind === 'show' ? row.episodes : null)],
  ['files', (row) => row.files],
  ['size_bytes', (row) => row.sizeBytes],
  ['added', (row) => row.latestAddedAt.slice(0, 10)],
  ['folder', (row) => row.folder],
];

const FORMULA = /^[=+\-@\t\r]/u;

/**
 * Writes one cell of a spreadsheet: quoted where it holds a comma, a quote or a new line, and led
 * by an apostrophe where a spreadsheet would otherwise run it as a formula.
 *
 * @param value - What the cell holds.
 * @returns The cell as written.
 */
const cellOf = (value: string | number | null): string => {
  if (value === null) {
    return '';
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  const safe = FORMULA.test(value) ? `'${value}` : value;

  return /[",\n\r]/u.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
};

/**
 * Writes a list of titles out as a spreadsheet, one title a row, for an administrator to keep or
 * look through elsewhere.
 *
 * @param rows - The titles, in the order listed.
 * @returns The spreadsheet, as comma-separated values with a heading row.
 */
const csvOfTitles = (rows: readonly TitleRow[]): string =>
  [
    COLUMNS.map(([name]) => name).join(','),
    ...rows.map((row) => COLUMNS.map(([, read]) => cellOf(read(row))).join(',')),
  ].join('\r\n') + '\r\n';

export { csvOfTitles };
