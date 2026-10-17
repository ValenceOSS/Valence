import { z } from 'zod';

const AUDIT_ACTIONS = [
  'account.created',
  'account.removed',
  'account.rolesChanged',
  'account.passwordReset',
  'account.signedOutEverywhere',
  'account.sessionEnded',
  'account.banned',
  'account.unbanned',
  'account.changed',
  'role.created',
  'role.changed',
  'role.removed',
  'share.withdrawn',
  'files.removed',
  'files.moved',
  'files.renamed',
  'media.removed',
  'settings.changed',
  'library.added',
  'library.changed',
  'library.removed',
  'library.reset',
  'plugin.installed',
  'plugin.changed',
  'plugin.removed',
  'webhook.added',
  'webhook.changed',
  'webhook.removed',
  'backup.taken',
  'backup.removed',
] as const;

const AuditActionSchema = z.enum(AUDIT_ACTIONS);

const AuditEntrySchema = z.object({
  id: z.string(),
  at: z.string().datetime(),
  actorId: z.string().nullable(),
  actorName: z.string(),
  action: AuditActionSchema,
  target: z.string().nullable(),
  detail: z.record(z.string(), z.string()).nullable(),
});

const AuditPageSchema = z.object({
  entries: z.array(AuditEntrySchema),
  nextCursor: z.string().nullable(),
});

const AuditQuerySchema = z.object({
  action: AuditActionSchema.optional(),
  actorId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

type AuditAction = z.infer<typeof AuditActionSchema>;
type AuditEntry = z.infer<typeof AuditEntrySchema>;
type AuditPage = z.infer<typeof AuditPageSchema>;
type AuditQuery = z.infer<typeof AuditQuerySchema>;

export type { AuditAction, AuditEntry, AuditPage, AuditQuery };

export { AUDIT_ACTIONS, AuditActionSchema, AuditEntrySchema, AuditPageSchema, AuditQuerySchema };
