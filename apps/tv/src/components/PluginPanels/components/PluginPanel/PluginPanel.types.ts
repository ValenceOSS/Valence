type PluginPanelProps = {
  pluginId: string;
  pluginName: string;
  panelId: string;
  title: string;
  on: 'title' | 'series' | 'book';
  subjectId: string;
};

export type { PluginPanelProps };
