import type {
  LiveGuide,
  LiveHealth,
  LiveSource,
  NewLiveSource,
  LiveSourceChange,
} from '@ValenceContracts/schemas/LiveTv';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { StoredLiveChannel } from './LiveTvStore';

type LiveTvService = {
  sources: () => Promise<LiveSource[]>;
  add: (source: NewLiveSource) => Promise<LiveSource>;
  remove: (id: string) => Promise<boolean>;
  refresh: (id: string) => Promise<LiveSource | null>;
  changeGuide: (id: string, guideUrl: string | null) => Promise<LiveSource | null>;
  change: (id: string, change: LiveSourceChange) => Promise<LiveSource | Said | null>;
  changeLogo: (id: string, logoUrl: string | null) => Promise<LiveSource | null>;
  isEmbedded: (channel: StoredLiveChannel) => Promise<boolean>;
  isFromThePublicInternet: (channel: StoredLiveChannel) => Promise<boolean>;
  refreshAll: () => Promise<number>;
  checkAll: () => Promise<Record<LiveHealth, number>>;
  guide: (profileId: string | null, from: Date, until: Date) => Promise<LiveGuide>;
  channel: (id: string) => Promise<StoredLiveChannel | null>;
  keep: (profileId: string, channelId: string) => Promise<boolean>;
  drop: (profileId: string, channelId: string) => Promise<void>;
};

export type { LiveTvService };
