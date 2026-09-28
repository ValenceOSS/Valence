import type { SurfaceAction } from '@ValenceSDK/surface/SurfaceActionSchema';
import type { SurfaceBlock } from '@ValenceSDK/surface/SurfaceBlockSchema';

type PluginRowProps = {
  pluginId: string;
  row: Extract<SurfaceBlock, { type: 'row' }>;
  onAct: (action: SurfaceAction) => void;
  isActing: boolean;
};

export type { PluginRowProps };
