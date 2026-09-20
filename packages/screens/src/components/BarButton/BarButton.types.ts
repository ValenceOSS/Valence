import type { IconGesture } from '@ValenceUI/AnimatedIcon.types';
import type { IconGlyph } from '@ValenceUI/Icon.types';

type BarButtonProps = {
  label: string;
  glyph: IconGlyph;
  litGlyph?: IconGlyph;
  gesture?: IconGesture;
  iconSize?: number;
  isLit?: boolean;
  isDisabled?: boolean;
  className?: string;
  onClick: () => void;
};

export type { BarButtonProps };
