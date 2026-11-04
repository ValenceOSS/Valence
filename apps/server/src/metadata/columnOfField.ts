import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';
import type { EditableColumns, EditScope } from './EditableColumns';

const COLUMNS: Record<EditScope, readonly (readonly [TitleField, keyof EditableColumns])[]> = {
  film: [
    ['title', 'title'],
    ['sortTitle', 'sortTitle'],
    ['originalTitle', 'originalTitle'],
    ['tagline', 'tagline'],
    ['overview', 'overview'],
    ['releaseDate', 'releaseDate'],
    ['genres', 'genres'],
    ['tags', 'tags'],
    ['studios', 'studios'],
    ['certifications', 'certifications'],
    ['rating', 'rating'],
    ['rottenTomatoes', 'rottenTomatoes'],
    ['imdbId', 'imdbId'],
    ['tvdbId', 'tvdbId'],
  ],
  show: [
    ['title', 'seriesTitle'],
    ['sortTitle', 'seriesSortTitle'],
    ['originalTitle', 'originalTitle'],
    ['tagline', 'tagline'],
    ['genres', 'genres'],
    ['tags', 'tags'],
    ['studios', 'studios'],
    ['networks', 'networks'],
    ['certifications', 'certifications'],
    ['rating', 'rating'],
    ['imdbId', 'imdbId'],
    ['tvdbId', 'tvdbId'],
  ],
  episode: [
    ['title', 'title'],
    ['overview', 'overview'],
    ['releaseDate', 'releaseDate'],
  ],
};

/**
 * Says which stored column holds a field of a film's, a programme's or an episode's metadata.
 *
 * @param scope - Whose field it is.
 * @param field - The field.
 * @returns The column, or nothing where the field is not stored on the file.
 */
const columnOfField = (scope: EditScope, field: TitleField): keyof EditableColumns | undefined =>
  COLUMNS[scope].find(([one]) => one === field)?.[1];

export { columnOfField };
