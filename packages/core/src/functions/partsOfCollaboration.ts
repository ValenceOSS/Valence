const JOINERS = /\s*(?:&|,|\+|\s(?:x|and|with|feat\.?|ft\.?|featuring)\s)\s*/i;

/**
 * The artists an album's credit names where it is a collaboration of the artist given among others,
 * such as "One & Another" or "One x Another" for "One"; nothing where it names the artist alone or
 * somebody else. "Simon & Garfunkel" is a collaboration only of an artist named Simon, which keeps
 * a duo's own name whole.
 *
 * @param credit - The album's artist credit.
 * @param artist - The artist.
 * @returns Each artist the credit names, the one given first, or null where it is no collaboration
 *   of theirs.
 */
const partsOfCollaboration = (credit: string, artist: string): string[] | null => {
  const parts = credit
    .split(JOINERS)
    .map((part) => part.trim())
    .filter((part) => part !== '');
  const wanted = artist.trim().toLowerCase();
  const own = parts.find((part) => part.toLowerCase() === wanted);

  return parts.length > 1 && own !== undefined
    ? [own, ...parts.filter((part) => part.toLowerCase() !== wanted)]
    : null;
};

export { partsOfCollaboration };
