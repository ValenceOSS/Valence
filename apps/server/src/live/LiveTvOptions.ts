import type { IptvOrgCatalogueReader } from './createIptvOrgCatalogue';
import type { LiveRelay } from './createLiveRelay';
import type { LiveTvService } from './LiveTvService';
import type { StoredLiveChannel } from './LiveTvStore';
import type { TranscoderStreamedFile } from '@ValenceServer/transcoder/TranscoderClient';

type LiveTvOptions = {
  service: LiveTvService;
  relay: LiveRelay;
  iptvOrg: IptvOrgCatalogueReader;
  fetcher: typeof fetch;
  startTranscoded?: (channel: StoredLiveChannel) => Promise<string | null>;
  readTranscoded?: (liveId: string, name: string) => Promise<TranscoderStreamedFile | null>;
};

export type { LiveTvOptions };
