/**
 * The key a source library's folder is remembered under once Valence has a library for it.
 *
 * @param sourceLibraryId - The library on the source.
 * @param sourcePath - One of its folders, as the source sees it.
 * @returns The key.
 */
const libraryLinkKey = (sourceLibraryId: string, sourcePath: string): string =>
  `${sourceLibraryId}|${sourcePath}`;

export { libraryLinkKey };
