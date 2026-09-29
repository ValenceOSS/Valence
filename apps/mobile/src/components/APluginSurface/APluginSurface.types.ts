import type { Surface } from '@ValenceSDK/surface/SurfaceSchema';
import type { SurfaceAction } from '@ValenceSDK/surface/SurfaceActionSchema';

type APluginSurfaceProps = {
  pluginId: string;
  surface: Surface;
  onAct: (action: SurfaceAction, fields: Record<string, string | boolean>) => void;
  isActing?: boolean;
  onLookAt?: (mediaId: string) => void;
};

export type { APluginSurfaceProps };
