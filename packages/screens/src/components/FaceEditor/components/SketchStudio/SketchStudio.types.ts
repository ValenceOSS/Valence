import type { SketchScene } from '@ValenceContracts/schemas/SketchScene';

type SketchTool = 'move' | 'pen' | 'pencil' | 'marker' | 'eraser';

type SketchStudioProps = {
  scene: SketchScene;
  onChange: (scene: SketchScene) => void;
};

export type { SketchStudioProps, SketchTool };
