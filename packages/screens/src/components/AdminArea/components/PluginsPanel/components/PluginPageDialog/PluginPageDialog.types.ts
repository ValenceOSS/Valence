type PluginPageDialogProps = {
  page: { pluginId: string; pageId: string; title: string } | null;
  onClose: () => void;
};

export type { PluginPageDialogProps };
