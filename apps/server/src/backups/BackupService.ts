import type { Backup, BackupList } from '@ValenceContracts/schemas/Backup';

type BackupService = {
  list: () => Promise<BackupList>;
  take: (kind: 'byHand' | 'onSchedule') => Promise<Backup | 'missing'>;
  remove: (name: string) => Promise<boolean>;
  fileOf: (name: string) => Promise<string | null>;
};

export type { BackupService };
