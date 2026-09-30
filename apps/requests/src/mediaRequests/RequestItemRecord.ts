import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';
import type { RecordStore } from '@ValenceRequests/stores/RecordStore';

type RequestItemRecord = RequestItem & {
  requestId: string;
  indexerId: string | null;
  filedTitle: string | null;
  filedScore: number | null;
  attempts: number;
  isPickedByHand: boolean;
};

type RequestItemStore = RecordStore<RequestItemRecord>;

export type { RequestItemRecord, RequestItemStore };
