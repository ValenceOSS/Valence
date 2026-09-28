import type { Surface } from '@ValenceSDK/surface/SurfaceSchema';
import type { SurfaceAction } from '@ValenceSDK/surface/SurfaceActionSchema';

type PluginSurfaceProps = {
  pluginId: string;
  surface: Surface;
  onAct: (action: SurfaceAction, fields: Record<string, string | boolean>) => void;
  isActing?: boolean;
  className?: string;
};

export type { PluginSurfaceProps };
