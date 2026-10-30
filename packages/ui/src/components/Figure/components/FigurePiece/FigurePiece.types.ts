import type { MotionValue } from 'motion/react';
import type { FigureDrawing, FigurePieceDrawing } from '@ValenceUI/Figure.types';

type FigureMask = {
  file: string;
  follows: number;
  composite: 'add' | 'subtract' | 'intersect';
};

type FigurePieceProps = {
  piece: FigurePieceDrawing;
  drawing: FigureDrawing;
  spread: MotionValue<number>;
};

export type { FigureMask, FigurePieceProps };
