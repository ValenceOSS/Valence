import type { SurfaceAction } from '@ValenceSDK/surface/SurfaceActionSchema';
import type { SurfaceBlock } from '@ValenceSDK/surface/SurfaceBlockSchema';

type PluginBlockProps = {
  pluginId: string;
  block: SurfaceBlock;
  fields: Record<string, string | boolean>;
  onField: (field: string, value: string | boolean) => void;
  onAct: (action: SurfaceAction) => void;
  isActing: boolean;
};

export type { PluginBlockProps };
