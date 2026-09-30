import type { MotionValue } from 'motion/react';
import type { ReactNode } from 'react';
import type { CurlLeaf, CurlPoint } from '@ValenceCore/functions/pageCurl.types';

type PageCurlProps = {
  leaf: CurlLeaf;
  corner: CurlPoint;
  x: MotionValue<number>;
  y: MotionValue<number>;
  under: ReactNode;
  rest?: ReactNode;
  front: ReactNode;
  back: ReactNode;
  isBackFacing: boolean;
};

export type { PageCurlProps };
