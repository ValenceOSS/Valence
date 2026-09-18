import type { IconGesture } from '@ValenceUI/AnimatedIcon.types';
import type { IconGlyph } from '@ValenceUI/Icon.types';

type BarButtonProps = {
  label: string;
  glyph: IconGlyph;
  gesture?: IconGesture;
  iconSize?: number;
  isLit?: boolean;
  isSolid?: boolean;
  isDisabled?: boolean;
  className?: string;
  onClick: () => void;
};

export type { BarButtonProps };
