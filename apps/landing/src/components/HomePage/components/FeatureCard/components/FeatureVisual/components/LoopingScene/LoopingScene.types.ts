import type { ComponentType } from 'react';

type SceneAnchor = 'left' | 'right' | 'centre';

type LoopingSceneProps = {
  scene: ComponentType;
  frames: number;
  still: number;
  startsAt?: number;
  anchor: SceneAnchor;
};

export type { LoopingSceneProps, SceneAnchor };
