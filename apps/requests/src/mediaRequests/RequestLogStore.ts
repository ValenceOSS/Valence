import type { RequestLogEntry } from '@ValenceContracts/schemas/MediaRequest';
import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';

type RequestLogStore = {
  add: (requestId: string, message: string, problemCode?: ProblemCode | null) => Promise<void>;
  list: (requestId: string) => Promise<RequestLogEntry[]>;
};

export type { RequestLogStore };
