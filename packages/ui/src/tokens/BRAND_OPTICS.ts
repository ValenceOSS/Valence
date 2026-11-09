import type { BrandMarkName } from '@ValenceUI/BrandGlyph.types';

const BRAND_OPTICS: Readonly<Partial<Record<BrandMarkName, { side: number; middle: number }>>> = {
  android: { side: 0, middle: 0.572 },
  apple: { side: 0.093, middle: 0.587 },
  brave: { side: 0.074, middle: 0.464 },
  docker: { side: 0, middle: 0.555 },
  firefox: { side: 0.016, middle: 0.564 },
  github: { side: 0, middle: 0.463 },
  linux: { side: 0.088, middle: 0.528 },
  valence: { side: 0, middle: 0.444 },
};

export { BRAND_OPTICS };
