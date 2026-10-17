import { z } from 'zod';

const BACKUP_KINDS = ['beforeUpgrade', 'byHand', 'onSchedule'] as const;

const BackupKindSchema = z.enum(BACKUP_KINDS);

const BackupSchema = z.object({
  name: z.string(),
  kind: BackupKindSchema,
  takenAt: z.string().datetime(),
  sizeBytes: z.number().int().nonnegative(),
  before: z.string().nullable(),
});

const BackupListSchema = z.object({
  backups: z.array(BackupSchema),
  folder: z.string(),
  tool: z.string(),
  isToolInstalled: z.boolean(),
  kept: z.number().int().positive(),
  restoreCommand: z.string(),
});

type BackupKind = z.infer<typeof BackupKindSchema>;
type Backup = z.infer<typeof BackupSchema>;
type BackupList = z.infer<typeof BackupListSchema>;

export type { Backup, BackupKind, BackupList };

export { BACKUP_KINDS, BackupKindSchema, BackupListSchema, BackupSchema };
