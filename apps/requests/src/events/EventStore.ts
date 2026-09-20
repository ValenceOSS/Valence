import type { ServiceEvent } from '@ValenceContracts/schemas/DownloadQueue';

type Drafted<Event extends ServiceEvent> = Event extends ServiceEvent
  ? Omit<Event, 'id' | 'at'>
  : never;

type ServiceEventDraft = Drafted<ServiceEvent>;

type EventStore = {
  add: (event: ServiceEventDraft) => Promise<ServiceEvent>;
  pending: () => Promise<ServiceEvent[]>;
  acknowledge: (ids: readonly number[]) => Promise<void>;
};

export type { EventStore, ServiceEventDraft };
