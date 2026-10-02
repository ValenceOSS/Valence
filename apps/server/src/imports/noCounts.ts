import type { MediaImportCounts } from '@ValenceContracts/schemas/MediaImport';

/**
 * The counts of an import before anything has been counted.
 *
 * @returns Every count at nought.
 */
const noCounts = (): MediaImportCounts => ({
  people: 0,
  libraries: 0,
  items: 0,
  matched: 0,
  unmatched: 0,
  watched: 0,
  resumes: 0,
  plays: 0,
  favourites: 0,
  ratings: 0,
  playlists: 0,
  collections: 0,
  markers: 0,
});

export { noCounts };
