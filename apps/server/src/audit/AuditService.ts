import type { AuditAction, AuditPage, AuditQuery } from '@ValenceContracts/schemas/Audit';

type AuditToRecord = {
  actorId: string | null;
  actorName: string;
  action: AuditAction;
  target?: string | null;
  detail?: Readonly<Record<string, string>> | null;
  address?: string | null;
  userAgent?: string | null;
};

type AuditRecording = {
  foldWithinMs?: number;
};

type AuditService = {
  record: (entry: AuditToRecord, recording?: AuditRecording) => Promise<void>;
  list: (query: AuditQuery) => Promise<AuditPage>;
  prune: (now: Date) => Promise<number>;
};

export type { AuditRecording, AuditService, AuditToRecord };
