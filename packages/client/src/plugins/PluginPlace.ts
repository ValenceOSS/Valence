type PluginPlace =
  | { kind: 'page'; pluginId: string; pageId: string }
  | {
      kind: 'panel';
      pluginId: string;
      panelId: string;
      on: 'title' | 'series' | 'album' | 'artist' | 'playlist';
      subjectId: string;
    };

export type { PluginPlace };
