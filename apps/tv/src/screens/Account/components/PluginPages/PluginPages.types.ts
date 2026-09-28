type PluginPagesProps = {
  onOpen: (page: { pluginId: string; pageId: string }) => void;
  onFocus?: () => void;
};

export type { PluginPagesProps };
