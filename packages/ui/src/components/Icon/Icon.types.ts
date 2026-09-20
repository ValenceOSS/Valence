import type { IconProps as GlyphProps } from '@keyline-icons/react';
import type { ComponentType } from 'react';

type IconGlyph = ComponentType<GlyphProps>;

type IconTone = 'inherit' | 'strong' | 'muted' | 'faint' | 'danger' | 'scrim';

type IconProps = {
  of: IconGlyph;
  whenActive?: IconGlyph;
  isActive?: boolean;
  size?: number;
  tone?: IconTone;
  className?: string;
  label?: string;
};

export type { IconGlyph, IconProps, IconTone };
