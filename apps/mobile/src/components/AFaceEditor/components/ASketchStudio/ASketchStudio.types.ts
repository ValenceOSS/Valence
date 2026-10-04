import type { SketchScene } from '@ValenceContracts/schemas/SketchScene';

type ASketchStudioProps = {
  scene: SketchScene;
  onChange: (scene: SketchScene) => void;
  side: number;
};

export type { ASketchStudioProps };
