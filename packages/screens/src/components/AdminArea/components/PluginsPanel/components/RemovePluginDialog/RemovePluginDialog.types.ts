import type { InstalledPlugin } from '@ValenceContracts/schemas/Plugin';

type RemovePluginDialogProps = {
  plugin: InstalledPlugin | null;
  isBusy: boolean;
  onClose: () => void;
  onTurnOff: () => void;
  onConfirm: () => void;
};

export type { RemovePluginDialogProps };
