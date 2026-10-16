import type { PictureLimits } from '@ValenceServer/profiles/whatIsWrongWithThePicture';

const BRAND_LOGO_LIMITS: PictureLimits = {
  mostBytes: 2 * 1024 * 1024,
  mostPixelsAnEdge: 2048,
};

export { BRAND_LOGO_LIMITS };
