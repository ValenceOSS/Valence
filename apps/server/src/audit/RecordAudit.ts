import type { Context } from 'hono';
import type { AuditAction } from '@ValenceContracts/schemas/Audit';
import type { AuditRecording } from '@ValenceServer/audit/AuditService';

type RecordAudit = (
  asked: Context,
  action: AuditAction,
  target?: string | null,
  detail?: Readonly<Record<string, string>> | null,
  recording?: AuditRecording,
) => Promise<void>;

export type { RecordAudit };
