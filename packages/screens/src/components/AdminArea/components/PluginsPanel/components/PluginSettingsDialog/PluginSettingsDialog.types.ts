import type { InstalledPlugin } from '@ValenceContracts/schemas/Plugin';

type PluginSettingsDialogProps = {
  plugin: InstalledPlugin | null;
  redirectUri: string | null;
  onClose: () => void;
  onSaved: () => void;
};

export type { PluginSettingsDialogProps };
