import type { AuditAction, AuditPage, AuditQuery } from '@ValenceContracts/schemas/Audit';

type AuditToRecord = {
  actorId: string | null;
  actorName: string;
  action: AuditAction;
  target?: string | null;
  detail?: Readonly<Record<string, string>> | null;
};

type AuditService = {
  record: (entry: AuditToRecord) => Promise<void>;
  list: (query: AuditQuery) => Promise<AuditPage>;
};

export type { AuditService, AuditToRecord };
