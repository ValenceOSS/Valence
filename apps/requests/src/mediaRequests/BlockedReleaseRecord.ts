import type { Said } from '@ValenceI18n/SaidSchema';
import type { RecordStore } from '@ValenceRequests/stores/RecordStore';

type BlockedReleaseRecord = {
  id: string;
  requestId: string;
  title: string;
  infoHash: string | null;
  indexerId: string | null;
  reason: Said;
  at: string;
};

type BlockedReleaseStore = RecordStore<BlockedReleaseRecord>;

export type { BlockedReleaseRecord, BlockedReleaseStore };
