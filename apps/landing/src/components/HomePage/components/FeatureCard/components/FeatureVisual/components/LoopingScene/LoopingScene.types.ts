import type { ComponentType } from 'react';

type LoopingSceneProps = {
  scene: ComponentType;
  frames: number;
  width: number;
  height: number;
  still: number;
  className?: string;
};

export type { LoopingSceneProps };
