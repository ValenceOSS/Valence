import type { theGlyphs } from '@ValencePhone/theme/theGlyphs';

type GlyphName = keyof typeof theGlyphs;

type IconProps = {
  of: GlyphName;
  size?: number;
  colour: string;
  label?: string;
};

export type { GlyphName, IconProps };
