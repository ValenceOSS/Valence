import { createNzbgetAdapter } from '@ValenceRequests/downloads/createNzbgetAdapter';
import { createPluginAdapter } from '@ValenceRequests/downloads/createPluginAdapter';
import { createQbittorrentAdapter } from '@ValenceRequests/downloads/createQbittorrentAdapter';
import { createSabnzbdAdapter } from '@ValenceRequests/downloads/createSabnzbdAdapter';
import { createTransmissionAdapter } from '@ValenceRequests/downloads/createTransmissionAdapter';
import type {
  ClientFetch,
  DownloadClientAdapter,
} from '@ValenceRequests/downloads/DownloadClientAdapter';
import type { DownloadClientRecord } from '@ValenceRequests/downloads/DownloadClientRecord';
import type { LinkFetcher } from '@ValenceRequests/downloads/createLinkFetcher';
import type { SentToPlugin } from '@ValenceRequests/downloads/createPluginAdapter';
import type { PluginCallChannel } from '@ValenceRequests/pluginCalls/createPluginCallChannel';

type AdapterNeeds = {
  fetch: ClientFetch;
  plugins: {
    channel: Pick<PluginCallChannel, 'call'>;
    fetcher: LinkFetcher;
    sent: (clientId: string) => Promise<SentToPlugin[]>;
  };
};

/**
 * The adapter that speaks to a download client: in its own way for each kind Valence knows, and
 * through its plugin for one a plugin provides.
 *
 * @param record - The client.
 * @param needs - How to ask a client over the network, and how to reach a plugin.
 * @returns The adapter.
 */
const createAdapterFor = (
  record: DownloadClientRecord,
  { fetch, plugins }: AdapterNeeds,
): DownloadClientAdapter => {
  const settings = { ...record, categories: Object.values(record.categories) };

  switch (record.kind) {
    case 'qbittorrent':
      return createQbittorrentAdapter(settings, fetch);
    case 'transmission':
      return createTransmissionAdapter(settings, fetch);
    case 'sabnzbd':
      return createSabnzbdAdapter(settings, fetch);
    case 'nzbget':
      return createNzbgetAdapter(settings, fetch);
    case 'plugin':
      return createPluginAdapter({
        client: record,
        channel: plugins.channel,
        fetcher: plugins.fetcher,
        sent: () => plugins.sent(record.id),
      });
  }
};

export type { AdapterNeeds };

export { createAdapterFor };
