import type { BrandMarkName } from '@ValenceUI/BrandGlyph.types';

type ScreenTileProps = {
  screen: {
    label: string;
    mark: BrandMarkName;
    where: string;
  };
  index: number;
  count: number;
};

export type { ScreenTileProps };
