import type { SketchScene } from '@ValenceContracts/schemas/SketchScene';

type ASketchTool = 'move' | 'pen' | 'pencil' | 'marker' | 'eraser';

type ASketchPadProps = {
  scene: SketchScene;
  onChange: (scene: SketchScene) => void;
  tool: ASketchTool;
  ink: string;
  size: number;
  side: number;
};

export type { ASketchPadProps, ASketchTool };
