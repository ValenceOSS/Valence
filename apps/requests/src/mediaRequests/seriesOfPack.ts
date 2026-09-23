const COUNTED = /\b(?:books?|vol(?:ume)?s?\.?|parts?)\s*#?\d+(?:\s*[-–&,]\s*\d+)*/gi;

const RANGE = /[[(]\s*\d+\s*[-–]\s*\d+\s*[\])]|#\s*\d+/g;

const PACKING =
  /\b(?:saga|series|collection|complete|box\s*set|boxed\s*set|trilogy|omnibus|unabridged|abridged|audiobooks?|m4b|mp3|epub)\b/gi;

const SEPARATORS = /[\s\-–_.,:;+]+/g;

/**
 * A name cleaned of an author, the numbering, the packaging words and the separators around them.
 *
 * @param name - The name.
 * @param authors - Who wrote the books, to leave out.
 * @returns What is left, or nothing.
 */
const cleanedOf = (name: string, authors: readonly string[]): string | null => {
  let left = name;

  for (const author of authors) {
    if (author.trim() !== '') {
      left = left.split(author).join(' ');
    }
  }

  const cleaned = left
    .replace(COUNTED, ' ')
    .replace(RANGE, ' ')
    .replace(PACKING, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/[[(]\s*[\])]/g, ' ')
    .replace(SEPARATORS, ' ')
    .trim();

  return cleaned === '' ? null : cleaned;
};

/**
 * What a pack of books calls the series it holds, from the names it came under — the download's
 * folder, then its release — once the author, the numbering and words like "Saga" and "Books 1-5"
 * are left out: "Pierce Brown-Red Rising-[1-5]" is the series "Red Rising".
 *
 * @param names - The names the pack came under, the likeliest first.
 * @param authors - Who wrote the books.
 * @returns The series, or nothing where the names say no more than the author.
 */
const seriesNameOf = (names: readonly string[], authors: readonly string[]): string | null => {
  for (const name of names) {
    const cleaned = cleanedOf(name, authors);

    if (cleaned !== null) {
      return cleaned;
    }
  }

  return null;
};

const NUMBERED_PART = /^(?:(?:book|vol(?:ume)?|part)\.?\s*)?#?\s*(\d{1,3})$/i;

/**
 * Where a book says it comes in its series, in its folder's name or its file's: a part of the name
 * that is only its number, as "#3", "Book 3" or a bare "5" between dashes.
 *
 * @param names - The book's folder and file names.
 * @returns Its place, or nothing where neither says.
 */
const placeNamed = (names: readonly string[]): number | null => {
  for (const name of names) {
    for (const part of name.split(/\s*[-–_]\s*/)) {
      const found = NUMBERED_PART.exec(part.trim());

      if (found?.[1] !== undefined) {
        return Number(found[1]);
      }
    }
  }

  return null;
};

/**
 * Where each book of a pack comes in its series: the places their names give where every book's
 * name gives one, and otherwise the order they came out in, then the order they were packed in.
 *
 * @param books - Each book's folder and file names, and the year it came out where known.
 * @returns Each book's place, counting from one.
 */
const placesInSeries = (
  books: readonly { names: readonly string[]; year: number | null }[],
): number[] => {
  const named = books.flatMap((book) => {
    const place = placeNamed(book.names);

    return place === null ? [] : [place];
  });

  if (named.length === books.length && new Set(named).size === named.length) {
    return named;
  }

  const order = books
    .map((book, at) => ({ at, year: book.year ?? Number.POSITIVE_INFINITY }))
    .toSorted((one, other) => one.year - other.year || one.at - other.at);
  const places = Array.from({ length: books.length }, () => 0);

  order.forEach(({ at }, place) => {
    places[at] = place + 1;
  });

  return places;
};

/**
 * What a book's folder calls it, where nothing inside it says: the last part of the name that is
 * not a number, "Pierce Brown-Red Rising-#2-Golden Son" being "Golden Son".
 *
 * @param name - The folder's name.
 * @returns The title.
 */
const titleFromFolderName = (name: string): string =>
  name
    .split(/\s*[-–]\s*/)
    .filter((part) => part.trim() !== '' && !NUMBERED_PART.test(part.trim()))
    .at(-1)
    ?.trim() ?? name;

export { placesInSeries, seriesNameOf, titleFromFolderName };
