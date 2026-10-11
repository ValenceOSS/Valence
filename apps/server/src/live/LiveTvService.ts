import type {
  LiveGuide,
  LiveHealth,
  LiveSource,
  NewLiveSource,
} from '@ValenceContracts/schemas/LiveTv';
import type { StoredLiveChannel } from './LiveTvStore';

type LiveTvService = {
  sources: () => Promise<LiveSource[]>;
  add: (source: NewLiveSource) => Promise<LiveSource>;
  remove: (id: string) => Promise<boolean>;
  refresh: (id: string) => Promise<LiveSource | null>;
  changeGuide: (id: string, guideUrl: string | null) => Promise<LiveSource | null>;
  changeLogo: (id: string, logoUrl: string | null) => Promise<LiveSource | null>;
  isEmbedded: (channel: StoredLiveChannel) => Promise<boolean>;
  refreshAll: () => Promise<number>;
  checkAll: () => Promise<Record<LiveHealth, number>>;
  guide: (profileId: string | null, from: Date, until: Date) => Promise<LiveGuide>;
  channel: (id: string) => Promise<StoredLiveChannel | null>;
  keep: (profileId: string, channelId: string) => Promise<boolean>;
  drop: (profileId: string, channelId: string) => Promise<void>;
};

export type { LiveTvService };
