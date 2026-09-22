import type { ComponentType } from 'react';

type GlyphProps = {
  size: number;
  colour: string;
};

type Glyph = ComponentType<GlyphProps>;

type IconProps = {
  of: Glyph;
  size?: number;
  colour: string;
  label?: string;
};

export type { Glyph, GlyphProps, IconProps };
