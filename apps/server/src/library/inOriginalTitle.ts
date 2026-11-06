import type { Metadata } from './MetadataProvider';

/**
 * Names a title by its original title rather than the catalogue's translated one, for a library
 * set to use original titles: a film itself, and an episode's programme, since an episode's own
 * title is its episode's.
 *
 * @param metadata - What the catalogue said of the file, or nothing.
 * @returns The same, named in its original title where it has one.
 */
const inOriginalTitle = (metadata: Metadata | null): Metadata | null => {
  const original = metadata?.originalTitle;

  if (metadata === null || original === undefined || original === '') {
    return metadata;
  }

  return metadata.seriesTitle === undefined
    ? { ...metadata, title: original }
    : { ...metadata, seriesTitle: original };
};

export { inOriginalTitle };
