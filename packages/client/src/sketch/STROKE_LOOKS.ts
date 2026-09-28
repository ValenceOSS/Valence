import type { SketchStroke } from '@ValenceContracts/schemas/SketchScene';

const STROKE_LOOKS: Record<
  SketchStroke['tool'],
  { alpha: number; thickness: number; cap: 'round' | 'square' }
> = {
  pen: { alpha: 1, thickness: 1, cap: 'round' },
  pencil: { alpha: 0.72, thickness: 0.55, cap: 'round' },
  marker: { alpha: 0.42, thickness: 1.6, cap: 'square' },
  eraser: { alpha: 1, thickness: 1.4, cap: 'round' },
};

export { STROKE_LOOKS };
