import type { PanelPlace } from '@ValenceSDK/manifest/PanelPlace';

type PluginPlace =
  | { kind: 'page'; pluginId: string; pageId: string }
  | {
      kind: 'panel';
      pluginId: string;
      panelId: string;
      on: PanelPlace;
      subjectId: string;
    };

export type { PluginPlace };
