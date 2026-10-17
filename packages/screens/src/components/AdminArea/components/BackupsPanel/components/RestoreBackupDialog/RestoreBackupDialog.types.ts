import type { Backup } from '@ValenceContracts/schemas/Backup';

type RestoreBackupDialogProps = {
  backup: Backup | null;
  restoreCommand: string;
  onClose: () => void;
};

export type { RestoreBackupDialogProps };
