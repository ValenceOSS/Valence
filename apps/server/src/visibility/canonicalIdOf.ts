const SPELLED = /^\{?[0-9a-fA-F](?:-?[0-9a-fA-F]){31}\}?$/;

/**
 * Writes an identifier the way the catalogue stores it — lower case, hyphenated in the usual
 * places — whichever of the spellings the database would also accept it in: without hyphens, with
 * them anywhere between digits, in braces or in capitals.
 *
 * An address is matched against the catalogue by the database, and Postgres finds an item from any
 * of those spellings, so anything that judges an address must read every one of them as the item it
 * reaches. Reading only the usual spelling lets the others through unjudged.
 *
 * @param segment - One segment of an address.
 * @returns The identifier in its usual spelling, or nothing where the segment is not one.
 */
const canonicalIdOf = (segment: string): string | null => {
  if (!SPELLED.test(segment)) {
    return null;
  }

  const digits = segment.replace(/[{}-]/g, '').toLowerCase();

  return [
    digits.slice(0, 8),
    digits.slice(8, 12),
    digits.slice(12, 16),
    digits.slice(16, 20),
    digits.slice(20),
  ].join('-');
};

export { canonicalIdOf };
