import type { ComponentType } from 'react';

type LoopingSceneProps = {
  scene: ComponentType;
  frames: number;
  width: number;
  height: number;
  still: number;
  startsAt?: number;
  className?: string;
};

export type { LoopingSceneProps };
