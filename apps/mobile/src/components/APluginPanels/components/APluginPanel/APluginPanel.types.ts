import type { PanelPlace } from '@ValenceSDK/manifest/PanelPlace';

type APluginPanelProps = {
  pluginId: string;
  pluginName: string;
  panelId: string;
  title: string;
  on: PanelPlace;
  subjectId: string;
  onLookAt?: ((mediaId: string) => void) | undefined;
};

export type { APluginPanelProps };
