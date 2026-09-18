/**
 * Reduces a name to what two spellings of the same artist or album have in common, so "Sleep Token"
 * and "sleep  token" land on one row rather than two. Case, accents, runs of spaces and the kind of
 * apostrophe are all things a tagger gets wrong between tracks of one release.
 *
 * @param name - The name as it was tagged.
 * @returns The key it is matched on.
 */
const nameKey = (name: string): string =>
  name
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[‘’`´]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export { nameKey };
