import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';
import type { RecordStore } from '@ValenceRequests/stores/RecordStore';

type RequestItemRecord = RequestItem & {
  requestId: string;
  indexerId: string | null;
  attempts: number;
};

type RequestItemStore = RecordStore<RequestItemRecord>;

export type { RequestItemRecord, RequestItemStore };
