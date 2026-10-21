import { fetchLibraryItems } from '@ValenceClient/library/fetchLibrary';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const PAGE_SIZE = 200;
const PAGES_AT_ONCE = 4;
const MOST_PAGES = 1000;

/**
 * Reads every item in a library, for the admin area's media page, which lists all of it. The first
 * page says how many there are, and the rest are asked for a few at a time rather than one after
 * another. A page that fails fails the read, and so does a library too large to read in full, since
 * a list missing part of a library would be taken for the library.
 *
 * @param libraryId - The library to read.
 * @param withVersions - Whether a film's other versions come too, as their own entries.
 * @returns Every item in it, each once.
 */
const readWholeLibrary = async (
  libraryId: string,
  withVersions = false,
): Promise<MediaSummary[]> => {
  const first = await fetchLibraryItems(libraryId, { withVersions, limit: PAGE_SIZE, offset: 0 });

  if (first.total > PAGE_SIZE * MOST_PAGES) {
    throw new Error(`The library holds ${first.total.toString()} items, more than can be listed.`);
  }

  const offsets: number[] = [];

  for (let offset = PAGE_SIZE; offset < first.total; offset += PAGE_SIZE) {
    offsets.push(offset);
  }

  const gathered = new Map(first.items.map((item) => [item.id, item]));

  for (let start = 0; start < offsets.length; start += PAGES_AT_ONCE) {
    const pages = await Promise.all(
      offsets
        .slice(start, start + PAGES_AT_ONCE)
        .map((offset) => fetchLibraryItems(libraryId, { withVersions, limit: PAGE_SIZE, offset })),
    );

    for (const page of pages) {
      for (const item of page.items) {
        gathered.set(item.id, item);
      }
    }
  }

  return [...gathered.values()];
};

export { readWholeLibrary };
