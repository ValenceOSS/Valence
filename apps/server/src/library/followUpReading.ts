import type { LibraryKind } from '@ValenceContracts/schemas/Library';

type FollowUps = {
  fetchLogos: (libraryId: string) => Promise<object | null | undefined>;
  detectSegments: (libraryId: string) => Promise<object | null | undefined>;
  regeneratePreviews: (libraryId: string) => Promise<object | null | undefined>;
  regenerateTrickplay: (libraryId: string) => Promise<object | null | undefined>;
};

/**
 * Asks for everything a library needs once new files have been read into it — the title lettering,
 * the intros and credits to skip, the hover previews and the scrubbing thumbnails — however those
 * files arrived. A full scan and a download being filed both read files, and each used to keep its
 * own list of what follows; the download's had lost the lettering, so anything that came in through
 * a request was drawn with its title in plain text for as long as nobody scanned the library.
 *
 * @param work - What can be asked of the library.
 * @param libraryId - The library that has just been read.
 * @param kind - What the library holds; music has none of this to do.
 */
const followUpReading = async (
  work: FollowUps,
  libraryId: string,
  kind: LibraryKind | undefined,
): Promise<void> => {
  if (kind === 'music') {
    return;
  }

  await work.fetchLogos(libraryId);

  if (kind === 'shows') {
    await work.detectSegments(libraryId);
  }

  await work.regeneratePreviews(libraryId);
  await work.regenerateTrickplay(libraryId);
};

export { followUpReading };
