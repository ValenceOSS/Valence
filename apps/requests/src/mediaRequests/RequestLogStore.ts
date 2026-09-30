import type { Said } from '@ValenceI18n/SaidSchema';
import type { RequestLogEntry } from '@ValenceContracts/schemas/MediaRequest';
import type { ProblemCode } from '@ValenceContracts/schemas/ProblemCode';

type RequestLogStore = {
  add: (requestId: string, message: Said, problemCode?: ProblemCode | null) => Promise<void>;
  list: (requestId: string) => Promise<RequestLogEntry[]>;
};

export type { RequestLogStore };
