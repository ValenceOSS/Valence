import type { PanelPlace } from '@ValenceSDK/manifest/PanelPlace';

type APluginPanelsProps = {
  on: PanelPlace;
  subjectId: string;
  onLookAt?: (mediaId: string) => void;
};

export type { APluginPanelsProps };
