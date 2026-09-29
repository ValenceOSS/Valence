import type { SurfaceAction } from '@ValenceSDK/surface/SurfaceActionSchema';
import type { SurfaceBlock } from '@ValenceSDK/surface/SurfaceBlockSchema';

type ARowBlockProps = {
  row: Extract<SurfaceBlock, { type: 'row' }>;
  pluginId: string;
  onAct: (action: SurfaceAction) => void;
  isActing: boolean;
};

export type { ARowBlockProps };
