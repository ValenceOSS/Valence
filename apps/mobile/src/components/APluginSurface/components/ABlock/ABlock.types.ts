import type { SurfaceAction } from '@ValenceSDK/surface/SurfaceActionSchema';
import type { SurfaceBlock } from '@ValenceSDK/surface/SurfaceBlockSchema';

type ABlockProps = {
  block: SurfaceBlock;
  pluginId: string;
  fields: Record<string, string | boolean>;
  onField: (field: string, value: string | boolean) => void;
  onAct: (action: SurfaceAction) => void;
  isActing: boolean;
  onLookAt?: (mediaId: string) => void;
};

export type { ABlockProps };
