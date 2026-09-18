const FEATURING = /\s+[([]?(?:feat\.?|ft\.?|featuring|with)\s+/i;

const LISTED = /\s*(?:;|\s\/\s)\s*/;

/**
 * Reads every artist a track credits out of what its tags say.
 *
 * A tag holding several artists is usually either several values, or one value with a guest named
 * after "feat." — both are read as separate artists, so a guest verse links to the guest. An
 * ampersand is not split on, because "Simon & Garfunkel" is one act and nothing in the tag says
 * which reading was meant.
 *
 * @param tagged - Every artist value the tags held.
 * @returns The artists, each named once, in the order they were credited.
 */
const splitArtists = (tagged: readonly string[]): string[] => {
  const named = tagged
    .flatMap((value) => value.split(LISTED))
    .flatMap((value) => value.split(FEATURING))
    .map((value) => value.replace(/^[([]|[)\]]$/g, '').trim())
    .filter((value) => value !== '');

  return named.filter(
    (value, at) => named.findIndex((other) => other.toLowerCase() === value.toLowerCase()) === at,
  );
};

export { splitArtists };
