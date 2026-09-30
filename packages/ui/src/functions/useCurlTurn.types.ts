import type { MotionValue } from 'motion/react';
import type { CurlHold, CurlLeaf } from '@ValenceCore/functions/pageCurl.types';

type CurlTurn = {
  x: MotionValue<number>;
  y: MotionValue<number>;
  lift: (leaf: CurlLeaf, heldAt: number, heading: 1 | -1) => CurlHold;
  pull: (hold: CurlHold, across: number, down: number) => void;
  carry: (hold: CurlHold, turns: boolean, onDone: () => void) => void;
  sweep: (hold: CurlHold, seconds: number, onDone: () => void) => void;
  stop: () => void;
};

export type { CurlTurn };
