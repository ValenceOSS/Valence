import type { BrandMarkName } from '@ValenceUI/BrandGlyph.types';
import type { IconGlyph } from '@ValenceUI/Icon.types';

type ScreenTileProps = {
  screen: {
    label: string;
    mark: BrandMarkName | IconGlyph;
    where: string;
  };
  index: number;
  count: number;
};

export type { ScreenTileProps };
