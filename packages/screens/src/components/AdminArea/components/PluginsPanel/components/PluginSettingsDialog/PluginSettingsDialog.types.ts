import type { InstalledPlugin } from '@ValenceContracts/schemas/Plugin';

type PluginSettingsDialogProps = {
  plugin: InstalledPlugin | null;
  onClose: () => void;
  onSaved: () => void;
};

export type { PluginSettingsDialogProps };
