import type { SurfaceAction } from '@ValenceSDK/surface/SurfaceActionSchema';
import type { SurfaceBlock } from '@ValenceSDK/surface/SurfaceBlockSchema';

type PluginRowProps = {
  row: Extract<SurfaceBlock, { type: 'row' }>;
  pluginId: string;
  onAct: (action: SurfaceAction) => void;
};

export type { PluginRowProps };
