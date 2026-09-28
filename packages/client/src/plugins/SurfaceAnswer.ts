import type { Surface } from '@ValenceSDK/surface/SurfaceSchema';

type SurfaceAnswer =
  { kind: 'surface'; surface: Surface } | { kind: 'navigate'; to: string } | { kind: 'unchanged' };

export type { SurfaceAnswer };
