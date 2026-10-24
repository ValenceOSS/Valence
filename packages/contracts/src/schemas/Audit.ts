import { z } from 'zod';

const AUDIT_CATEGORIES = [
  'auth',
  'account',
  'profile',
  'role',
  'library',
  'media',
  'files',
  'request',
  'share',
  'stream',
  'job',
  'settings',
  'plugin',
  'webhook',
  'backup',
] as const;

const AUDIT_ACTIONS = [
  'auth.signedIn',
  'auth.signInFailed',
  'auth.signedOut',
  'auth.passwordChanged',
  'auth.twoFactorTurnedOn',
  'auth.twoFactorTurnedOff',
  'auth.passkeyAdded',
  'auth.passkeyRemoved',
  'account.created',
  'account.removed',
  'account.rolesChanged',
  'account.permissionsChanged',
  'account.passwordReset',
  'account.signedOutEverywhere',
  'account.sessionEnded',
  'account.banned',
  'account.unbanned',
  'account.changed',
  'account.invited',
  'account.inviteWithdrawn',
  'account.keyCreated',
  'account.keyChanged',
  'account.keyRevoked',
  'profile.created',
  'profile.changed',
  'profile.removed',
  'profile.pinChanged',
  'role.created',
  'role.changed',
  'role.removed',
  'share.created',
  'share.withdrawn',
  'files.removed',
  'files.moved',
  'files.renamed',
  'media.removed',
  'media.moved',
  'media.artworkChosen',
  'media.artworkReset',
  'media.matchFixed',
  'media.matchReset',
  'settings.changed',
  'library.added',
  'library.changed',
  'library.removed',
  'library.reset',
  'library.scanned',
  'library.fileLeftOut',
  'library.fileBroughtBack',
  'request.made',
  'request.cancelled',
  'request.approved',
  'request.refused',
  'request.removed',
  'stream.stopped',
  'job.started',
  'job.cancelled',
  'plugin.installed',
  'plugin.changed',
  'plugin.removed',
  'plugin.rolledBack',
  'plugin.keysChanged',
  'webhook.added',
  'webhook.changed',
  'webhook.removed',
  'backup.taken',
  'backup.removed',
] as const;

const AUDIT_ORDERS = ['newest', 'oldest'] as const;

const AuditCategorySchema = z.enum(AUDIT_CATEGORIES);

const AuditActionSchema = z.enum(AUDIT_ACTIONS);

const AuditEntrySchema = z.object({
  id: z.string(),
  at: z.string().datetime(),
  actorId: z.string().nullable(),
  actorName: z.string(),
  action: AuditActionSchema,
  target: z.string().nullable(),
  detail: z.record(z.string(), z.string()).nullable(),
  address: z.string().nullable().default(null),
  userAgent: z.string().nullable().default(null),
});

const AuditPageSchema = z.object({
  entries: z.array(AuditEntrySchema),
  nextCursor: z.string().nullable(),
});

const AuditQuerySchema = z.object({
  action: AuditActionSchema.optional(),
  category: AuditCategorySchema.optional(),
  actorId: z.string().optional(),
  search: z.string().trim().max(200).optional(),
  sinceMs: z.coerce.number().int().nonnegative().optional(),
  untilMs: z.coerce.number().int().nonnegative().optional(),
  order: z.enum(AUDIT_ORDERS).default('newest'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

type AuditCategory = z.infer<typeof AuditCategorySchema>;
type AuditAction = z.infer<typeof AuditActionSchema>;
type AuditEntry = z.infer<typeof AuditEntrySchema>;
type AuditOrder = (typeof AUDIT_ORDERS)[number];
type AuditPage = z.infer<typeof AuditPageSchema>;
type AuditQuery = z.infer<typeof AuditQuerySchema>;

export type { AuditAction, AuditCategory, AuditEntry, AuditOrder, AuditPage, AuditQuery };

export {
  AUDIT_ACTIONS,
  AUDIT_CATEGORIES,
  AUDIT_ORDERS,
  AuditActionSchema,
  AuditCategorySchema,
  AuditEntrySchema,
  AuditPageSchema,
  AuditQuerySchema,
};
