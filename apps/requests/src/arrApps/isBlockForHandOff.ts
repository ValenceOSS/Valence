import type { ArrAppKind } from '@ValenceContracts/schemas/ArrApp';
import type { ArrBlock } from '@ValenceRequests/arrApps/schemas/ArrBlocklistPageSchema';

/**
 * Whether an entry on a connected app's blocklist is for the film, series or artist a request was
 * handed over as.
 *
 * @param block - The entry.
 * @param kind - Which app it is.
 * @param handOffId - What the app calls the request's film, series or artist.
 * @returns Whether it is.
 */
const isBlockForHandOff = (block: ArrBlock, kind: ArrAppKind, handOffId: number): boolean => {
  switch (kind) {
    case 'radarr':
      return block.movieId === handOffId;
    case 'sonarr':
      return block.seriesId === handOffId;
    case 'lidarr':
      return block.artistId === handOffId;
    case 'prowlarr':
      return false;
  }
};

export { isBlockForHandOff };
