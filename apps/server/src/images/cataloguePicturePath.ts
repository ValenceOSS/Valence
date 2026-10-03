import { CATALOGUE_IMAGES } from '@ValenceServer/images/CATALOGUE_IMAGES';

const PICTURES = '/api/catalogue/pictures';

/**
 * Where this server serves one of the catalogue's pictures from, so a client draws it from here
 * rather than from the catalogue, and the picture is kept on this server's disk under the address
 * the library uses for the same picture. An address that is not the catalogue's is left as it is.
 *
 * @param url - The picture's address in the catalogue.
 * @returns Its address on this server.
 */
const cataloguePicturePath = (url: string | null): string | null =>
  url !== null && url.startsWith(`${CATALOGUE_IMAGES}/`)
    ? `${PICTURES}/${url.slice(CATALOGUE_IMAGES.length + 1)}`
    : url;

export { cataloguePicturePath };
