import { TITLE_FIELD_SCHEMAS } from '@ValenceContracts/schemas/TitleEdit';
import { columnOfField } from './columnOfField';
import type { CastEntry, TitleField, TitleValue } from '@ValenceContracts/schemas/TitleEdit';
import type { EditableColumns, EditScope } from './EditableColumns';

type HeldEdit = { field: TitleField; value: TitleValue };

type CatalogueValue = { scope: EditScope; field: TitleField; value: TitleValue };

/**
 * Reads the year a date falls in.
 *
 * @param day - The date, as `YYYY-MM-DD`.
 * @returns The year, or nothing where there is no date.
 */
const yearOf = (day: string | null): number | null =>
  day === null ? null : Number.parseInt(day.slice(0, 4), 10);

/**
 * Reads a value as text, where it is text.
 *
 * @param value - The value.
 * @returns The text, or nothing.
 */
const textOf = (value: TitleValue): string | null => (typeof value === 'string' ? value : null);

/**
 * Reads a value as a list of words, where it is one.
 *
 * @param value - The value.
 * @returns The words, or nothing.
 */
const wordsOf = (value: TitleValue): string[] | null =>
  Array.isArray(value) ? value.filter((one) => typeof one === 'string') : null;

/**
 * Reads a value as a cast, where it is one.
 *
 * @param value - The value.
 * @returns The cast, or nothing.
 */
const castOf = (value: TitleValue): CastEntry[] | null =>
  Array.isArray(value) ? value.filter((one) => typeof one !== 'string') : null;

/**
 * Reads a value as a number, where it is one.
 *
 * @param value - The value.
 * @returns The number, or nothing.
 */
const numberOf = (value: TitleValue): number | null => (typeof value === 'number' ? value : null);

const WRITERS: {
  [C in keyof EditableColumns]: (columns: EditableColumns, value: TitleValue) => EditableColumns;
} = {
  title: (columns, value) => ({ ...columns, title: textOf(value) ?? columns.title }),
  sortTitle: (columns, value) => ({ ...columns, sortTitle: textOf(value) }),
  originalTitle: (columns, value) => ({ ...columns, originalTitle: textOf(value) }),
  year: (columns, value) => ({ ...columns, year: numberOf(value) }),
  tagline: (columns, value) => ({ ...columns, tagline: textOf(value) }),
  overview: (columns, value) => ({ ...columns, overview: textOf(value) }),
  releaseDate: (columns, value) => ({ ...columns, releaseDate: textOf(value) }),
  addedAt: (columns, value) => ({ ...columns, addedAt: textOf(value) ?? columns.addedAt }),
  genres: (columns, value) => ({ ...columns, genres: wordsOf(value) }),
  tags: (columns, value) => ({ ...columns, tags: wordsOf(value) }),
  studios: (columns, value) => ({ ...columns, studios: wordsOf(value) }),
  networks: (columns, value) => ({ ...columns, networks: wordsOf(value) }),
  certifications: (columns, value) => ({
    ...columns,
    certifications:
      value !== null && typeof value === 'object' && !Array.isArray(value)
        ? { ...columns.certifications, ...value }
        : columns.certifications,
  }),
  rating: (columns, value) => ({ ...columns, rating: numberOf(value) }),
  rottenTomatoes: (columns, value) => ({ ...columns, rottenTomatoes: numberOf(value) }),
  imdbId: (columns, value) => ({ ...columns, imdbId: textOf(value) }),
  tvdbId: (columns, value) => ({ ...columns, tvdbId: textOf(value) }),
  anilistId: (columns, value) => ({ ...columns, anilistId: textOf(value) }),
  malId: (columns, value) => ({ ...columns, malId: textOf(value) }),
  castMembers: (columns, value) => ({ ...columns, castMembers: castOf(value) }),
  seriesTitle: (columns, value) => ({
    ...columns,
    seriesTitle: textOf(value) ?? columns.seriesTitle,
  }),
  seriesSortTitle: (columns, value) => ({ ...columns, seriesSortTitle: textOf(value) }),
};

/**
 * Lays an administrator's edits over what the catalogue and the file said about a file's title,
 * and keeps a note of what the catalogue said for every field that was edited, so the edit can show
 * it and be put back to it. A film's edits reach the film's own columns; a programme's reach the
 * columns every one of its episodes carries for it; an episode's reach that episode's own. An edit
 * whose value no longer passes the field's rule is passed over, and the catalogue's value stands.
 *
 * @param columns - What the scan would store, before any edit.
 * @param edits - The edits kept for the film, or for the programme and the episode.
 * @returns The columns to store, and the catalogue's value under each edited field.
 */
const overlayTitleEdits = (
  columns: EditableColumns,
  edits: Partial<Record<EditScope, readonly HeldEdit[]>>,
): { columns: EditableColumns; catalogue: CatalogueValue[] } => {
  let laid = columns;
  const catalogue: CatalogueValue[] = [];

  for (const scope of ['film', 'show', 'episode'] as const) {
    for (const edit of edits[scope] ?? []) {
      const column = columnOfField(scope, edit.field);
      const checked = TITLE_FIELD_SCHEMAS[edit.field].safeParse(edit.value);

      if (column === undefined) {
        continue;
      }

      catalogue.push({ scope, field: edit.field, value: columns[column] });

      if (!checked.success) {
        continue;
      }

      laid = WRITERS[column](laid, checked.data);

      if (column === 'releaseDate' && scope === 'film') {
        laid = { ...laid, year: yearOf(laid.releaseDate) ?? laid.year };
      }
    }
  }

  return { columns: laid, catalogue };
};

export type { HeldEdit, CatalogueValue };

export { overlayTitleEdits };
