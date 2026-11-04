import type { SeriesShape } from '@ValenceServer/library/MetadataProvider';
import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';
import type { StoredTitleEdit } from './createTitleEditStore';

/**
 * Finds the text an edit kept for one field of one title, where there is an edit for it.
 *
 * @param edits - The edits kept.
 * @param subjectKey - The title.
 * @param field - The field.
 * @returns The text, `null` where it was edited to nothing, or `undefined` where it was not edited.
 */
const editedText = (
  edits: readonly StoredTitleEdit[],
  subjectKey: string,
  field: TitleField,
): string | null | undefined => {
  const edit = edits.find((one) => one.subjectKey === subjectKey && one.field === field);

  if (edit === undefined) {
    return undefined;
  }

  return typeof edit.value === 'string' ? edit.value : null;
};

/**
 * Lays the edits kept for a programme and its seasons over the catalogue's live record of it: the
 * programme's overview and status, and each season's name, overview and air date, which no file
 * holds and the show page reads from the catalogue.
 *
 * @param shape - The catalogue's record, or nothing where it has none.
 * @param showKey - The programme's key.
 * @param edits - The edits kept for the programme and its seasons.
 * @returns The record with the edits laid over it, or nothing where there is neither.
 */
const overlayShowEdits = (
  shape: SeriesShape | null,
  showKey: string,
  edits: readonly StoredTitleEdit[],
): SeriesShape | null => {
  const overview = editedText(edits, showKey, 'overview');
  const status = editedText(edits, showKey, 'status');

  if (shape === null) {
    return overview === undefined && status === undefined
      ? null
      : { seasons: [], overview: overview ?? null, status: status ?? null };
  }

  return {
    ...shape,
    overview: overview === undefined ? (shape.overview ?? null) : overview,
    status: status === undefined ? (shape.status ?? null) : status,
    seasons: shape.seasons.map((season) => {
      const seasonKey = `${showKey}:s${season.seasonNumber.toString()}`;
      const name = editedText(edits, seasonKey, 'title');
      const seasonOverview = editedText(edits, seasonKey, 'overview');
      const airDate = editedText(edits, seasonKey, 'releaseDate');

      return {
        ...season,
        ...(name === undefined ? {} : { name }),
        ...(seasonOverview === undefined ? {} : { overview: seasonOverview }),
        ...(airDate === undefined ? {} : { airDate }),
      };
    }),
  };
};

export { overlayShowEdits };
