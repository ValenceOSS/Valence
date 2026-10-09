import type { Fulfilment } from '@ValenceContracts/schemas/ArrApp';
import type { ArrQueueRecord } from '@ValenceRequests/arrApps/schemas/ArrQueuePageSchema';
import type { ArrRelease } from '@ValenceRequests/arrApps/schemas/ArrReleaseSchema';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type ItemSighting =
  | { itemId: string; kind: 'imported'; path: string; folder: string }
  | { itemId: string; kind: 'queued'; record: ArrQueueRecord }
  | { itemId: string; kind: 'missing' }
  | { itemId: string; kind: 'unchanged' };

type QueuedFor = { record: ArrQueueRecord; itemIds: string[] };

type HandOffHandler = {
  place: (
    request: MediaRequestRecord,
    items: readonly RequestItemRecord[],
    handOff: Fulfilment,
  ) => Promise<number>;
  watch: (
    request: MediaRequestRecord,
    items: readonly RequestItemRecord[],
    handOff: Fulfilment,
    handOffId: number,
    queue: readonly ArrQueueRecord[],
  ) => Promise<ItemSighting[]>;
  search: (request: MediaRequestRecord, handOffId: number) => Promise<void>;
  releases: (
    request: MediaRequestRecord,
    items: readonly RequestItemRecord[],
    handOffId: number,
  ) => Promise<ArrRelease[]>;
  pageOf: (request: MediaRequestRecord, handOffId: number) => Promise<string | null>;
  queued: (
    request: MediaRequestRecord,
    items: readonly RequestItemRecord[],
    handOffId: number,
    queue: readonly ArrQueueRecord[],
  ) => Promise<QueuedFor[]>;
  monitor: (
    request: MediaRequestRecord,
    items: readonly RequestItemRecord[],
    handOffId: number,
    isMonitored: boolean,
  ) => Promise<void>;
};

export type { HandOffHandler, ItemSighting, QueuedFor };
