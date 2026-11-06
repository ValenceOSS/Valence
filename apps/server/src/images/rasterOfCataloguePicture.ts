import { CATALOGUE_IMAGES } from '@ValenceServer/images/CATALOGUE_IMAGES';

const DRAWING = /\.svg$/iu;

/**
 * Where to fetch one of the catalogue's pictures as pixels. The catalogue keeps many logos as SVG
 * drawings, which this server does not keep and most clients cannot draw, and it serves every one
 * of them as a PNG at the same address with the extension changed. An address that is not the
 * catalogue's, or not a drawing, is left as it is.
 *
 * @param url - The picture's address.
 * @returns The address to fetch it from.
 */
const rasterOfCataloguePicture = (url: string): string =>
  url.startsWith(`${CATALOGUE_IMAGES}/`) ? url.replace(DRAWING, '.png') : url;

export { rasterOfCataloguePicture };
