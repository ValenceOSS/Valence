type ArtworkPart = { season: number; episode: number | null };

/**
 * Writes which season or episode a picture is asked for as the query of an address.
 *
 * @param part - The season, and the episode where it is an episode's, or nothing for the title's.
 * @returns The query, with its question mark, or nothing.
 */
const queryOfPart = (part: ArtworkPart | undefined): string =>
  part === undefined
    ? ''
    : `?${new URLSearchParams({
        season: part.season.toString(),
        ...(part.episode === null ? {} : { episode: part.episode.toString() }),
      }).toString()}`;

export type { ArtworkPart };

export { queryOfPart };
