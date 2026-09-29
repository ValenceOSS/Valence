type APluginPanelProps = {
  pluginId: string;
  pluginName: string;
  panelId: string;
  title: string;
  on: 'title' | 'series' | 'album' | 'artist' | 'playlist';
  subjectId: string;
  onLookAt?: ((mediaId: string) => void) | undefined;
};

export type { APluginPanelProps };
