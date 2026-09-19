const EDITIONS =
  /\b(extended(?: cut| edition)?|director'?s cut|theatrical(?: cut)?|unrated|uncut|remastered|imax(?: enhanced)?|criterion(?: collection)?|special edition|(?:\d+(?:th|st|nd|rd) )?anniversary edition|deluxe(?: edition| version)?|collector'?s edition|super deluxe|taylor'?s version|open matte|expanded edition)\b/i;

/**
 * Which cut or edition a release is, where its name says: an extended or director's cut, IMAX, a
 * remaster, or for music a deluxe or anniversary edition.
 *
 * @param spaced - The name, with its words spaced.
 * @returns The edition as the name words it, or null.
 */
const readEdition = (spaced: string): string | null => EDITIONS.exec(spaced)?.[1] ?? null;

export { readEdition };
