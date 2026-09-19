import type { RequestLogEntry } from '@ValenceContracts/schemas/MediaRequest';

type RequestLogStore = {
  add: (requestId: string, message: string) => Promise<void>;
  list: (requestId: string) => Promise<RequestLogEntry[]>;
};

export type { RequestLogStore };
