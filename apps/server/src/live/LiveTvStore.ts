import type { LiveHealth, LiveSourceKind } from '@ValenceContracts/schemas/LiveTv';
import type { LiveRoute } from './createLiveRoutes';
import type { Said } from '@ValenceI18n/SaidSchema';
import type { ParsedChannel } from './ParsedChannel';
import type { ParsedProgramme } from './ParsedProgramme';

type StoredLiveSource = {
  id: string;
  name: string;
  kind: LiveSourceKind;
  address: string | null;
  guideUrl: string | null;
  logoUrl: string | null;
  playlist: string | null;
  channelCount: number;
  refreshedAt: Date | null;
  problem: Said | null;
  createdAt: Date;
};

type StoredLiveChannel = ParsedChannel & {
  id: string;
  sourceId: string;
  position: number;
  health: LiveHealth | null;
  route: LiveRoute | null;
  checkedAt: Date | null;
};

type StoredLiveProgramme = ParsedProgramme & { sourceId: string };

type LiveTvStore = {
  listSources: () => Promise<StoredLiveSource[]>;
  readSource: (id: string) => Promise<StoredLiveSource | null>;
  addSource: (source: StoredLiveSource) => Promise<void>;
  changeSource: (
    id: string,
    change: {
      channelCount?: number;
      refreshedAt?: Date;
      problem?: Said | null;
      guideUrl?: string | null;
      logoUrl?: string | null;
    },
  ) => Promise<void>;
  removeSource: (id: string) => Promise<boolean>;
  replaceChannels: (sourceId: string, channels: readonly StoredLiveChannel[]) => Promise<void>;
  replaceProgrammes: (sourceId: string, programmes: readonly ParsedProgramme[]) => Promise<void>;
  listChannels: () => Promise<StoredLiveChannel[]>;
  noteHealth: (channelId: string, health: LiveHealth, route: LiveRoute, at: Date) => Promise<void>;
  readChannel: (id: string) => Promise<StoredLiveChannel | null>;
  listProgrammes: (from: Date, until: Date) => Promise<StoredLiveProgramme[]>;
  favouritesOf: (profileId: string) => Promise<Set<string>>;
  keep: (profileId: string, channelId: string) => Promise<void>;
  drop: (profileId: string, channelId: string) => Promise<void>;
};

export type { LiveTvStore, StoredLiveChannel, StoredLiveProgramme, StoredLiveSource };
