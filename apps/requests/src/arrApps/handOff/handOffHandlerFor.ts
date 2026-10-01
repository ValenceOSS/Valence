import type { ArrAppKind } from '@ValenceContracts/schemas/ArrApp';
import type { ArrCaller } from '@ValenceRequests/arrApps/createArrCaller';
import { createLidarrHandOff } from '@ValenceRequests/arrApps/handOff/createLidarrHandOff';
import { createRadarrHandOff } from '@ValenceRequests/arrApps/handOff/createRadarrHandOff';
import { createSonarrHandOff } from '@ValenceRequests/arrApps/handOff/createSonarrHandOff';
import type { HandOffHandler } from '@ValenceRequests/arrApps/handOff/HandOffHandler';

/**
 * How a kind of app is handed requests: Radarr films, Sonarr series and Lidarr music, while
 * Prowlarr only keeps indexers and takes none.
 *
 * @param kind - The kind of app.
 * @param caller - How to ask it.
 * @returns The hand-off, or null for an app that takes no requests.
 */
const handOffHandlerFor = (
  kind: ArrAppKind,
  caller: Pick<ArrCaller, 'read' | 'send'>,
): HandOffHandler | null => {
  switch (kind) {
    case 'radarr':
      return createRadarrHandOff(caller);
    case 'sonarr':
      return createSonarrHandOff(caller);
    case 'lidarr':
      return createLidarrHandOff(caller);
    case 'prowlarr':
      return null;
  }
};

export { handOffHandlerFor };
