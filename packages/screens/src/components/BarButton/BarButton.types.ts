import type { IconGesture } from '@ValenceUI/AnimatedIcon.types';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import type { ReactNode } from 'react';

type BarButtonDrawing =
  | { glyph: IconGlyph; litGlyph?: IconGlyph; face?: never }
  | { face: ReactNode; glyph?: never; litGlyph?: never };

type BarButtonProps = BarButtonDrawing & {
  label: string;
  badge?: IconGlyph;
  gesture?: IconGesture;
  iconSize?: number;
  isLit?: boolean;
  isDisabled?: boolean;
  className?: string;
  onClick: () => void;
};

export type { BarButtonProps };
