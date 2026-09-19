import type { RecordStore } from '@ValenceRequests/stores/RecordStore';

type BlockedReleaseRecord = {
  id: string;
  requestId: string;
  title: string;
  indexerId: string | null;
  reason: string;
  at: string;
};

type BlockedReleaseStore = RecordStore<BlockedReleaseRecord>;

export type { BlockedReleaseRecord, BlockedReleaseStore };
