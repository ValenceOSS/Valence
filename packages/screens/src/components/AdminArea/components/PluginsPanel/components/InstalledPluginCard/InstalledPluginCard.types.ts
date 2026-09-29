import type { InstalledPlugin } from '@ValenceContracts/schemas/Plugin';

type InstalledPluginCardProps = {
  plugin: InstalledPlugin;
  isBusy: boolean;
  onToggle: () => void;
  onSettings: () => void;
  onUpdate: () => void;
  onRollback: () => void;
  onRemove: () => void;
  onOpenPage: (page: { pageId: string; title: string }) => void;
};

export type { InstalledPluginCardProps };
