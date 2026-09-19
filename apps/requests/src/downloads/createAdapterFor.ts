import { createNzbgetAdapter } from '@ValenceRequests/downloads/createNzbgetAdapter';
import { createQbittorrentAdapter } from '@ValenceRequests/downloads/createQbittorrentAdapter';
import { createSabnzbdAdapter } from '@ValenceRequests/downloads/createSabnzbdAdapter';
import { createTransmissionAdapter } from '@ValenceRequests/downloads/createTransmissionAdapter';
import type { DownloadClientKind } from '@ValenceContracts/schemas/DownloadClient';
import type {
  ClientFetch,
  ClientSettings,
  DownloadClientAdapter,
} from '@ValenceRequests/downloads/DownloadClientAdapter';

/**
 * The adapter that speaks to a kind of download client.
 *
 * @param kind - Which client it is.
 * @param settings - Where it is and how to log in.
 * @param fetch - How to ask.
 * @returns The adapter.
 */
const createAdapterFor = (
  kind: DownloadClientKind,
  settings: ClientSettings,
  fetch: ClientFetch,
): DownloadClientAdapter => {
  switch (kind) {
    case 'qbittorrent':
      return createQbittorrentAdapter(settings, fetch);
    case 'transmission':
      return createTransmissionAdapter(settings, fetch);
    case 'sabnzbd':
      return createSabnzbdAdapter(settings, fetch);
    case 'nzbget':
      return createNzbgetAdapter(settings, fetch);
  }
};

export { createAdapterFor };
