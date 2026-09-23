import type { BookContents } from '@ValenceContracts/schemas/Book';

/**
 * Which entry of a book's table of contents somebody is reading: the last one that starts at or
 * before where they are.
 *
 * An entry in an earlier part has started. An entry in the part being read has started if its place
 * is on or before the page showing; one whose place has not been found on any page yet is taken to
 * start with its part.
 *
 * @param contents - The table of contents.
 * @param part - The part being read.
 * @param page - The page of it showing.
 * @param pageOfAnchor - The page each place in this part is on, where it has been found.
 * @returns Which entry, by position in the contents, or nothing before the first.
 */
const contentsEntryAt = (
  contents: BookContents['contents'],
  part: number,
  page: number,
  pageOfAnchor: ReadonlyMap<string, number>,
): number | null => {
  let found: number | null = null;

  for (const [at, entry] of contents.entries()) {
    const starts =
      entry.part < part ||
      (entry.part === part &&
        (entry.anchor === null ? 0 : (pageOfAnchor.get(entry.anchor) ?? 0)) <= page);

    if (starts) {
      found = at;
    }
  }

  return found;
};

export { contentsEntryAt };
