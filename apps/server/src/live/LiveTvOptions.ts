import type { IptvOrgCatalogueReader } from './createIptvOrgCatalogue';
import type { LiveRelay } from './createLiveRelay';
import type { LiveRoutes } from './createLiveRoutes';
import type { LiveTvService } from './LiveTvService';
import type { StoredLiveChannel } from './LiveTvStore';
import type { TranscoderStreamedFile } from '@ValenceServer/transcoder/TranscoderClient';

type LiveTvOptions = {
  service: LiveTvService;
  relay: LiveRelay;
  iptvOrg: IptvOrgCatalogueReader;
  routes: LiveRoutes;
  startTranscoded?: (channel: StoredLiveChannel, proxy: string | null) => Promise<string | null>;
  readTranscoded?: (liveId: string, name: string) => Promise<TranscoderStreamedFile | null>;
};

export type { LiveTvOptions };
