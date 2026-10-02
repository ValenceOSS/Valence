import { cataloguePictureRoute } from '@ValenceServer/routes/CataloguePictureRoute';
import { CATALOGUE_IMAGES } from '@ValenceServer/images/CATALOGUE_IMAGES';
import { refuse } from '@ValenceI18n/refuse';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

const PICTURE_CACHING = 'public, max-age=604800, immutable';

/**
 * Serves the catalogue's pictures from this server's own store of artwork, fetching each once.
 *
 * The store is the one the library reads its artwork through, keyed by the picture's address, so
 * a backdrop, logo or still fetched for something on the release calendar is already on disk when
 * that title is filed into the library and asks for the same picture. A catalogue picture's file
 * name never changes what it shows, so a browser may keep it.
 *
 * @param app - The application to add the route to.
 * @param context - What the route reads from.
 */
const serveCataloguePicture = (app: OpenAPIHono, context: AppContext): void => {
  const { readImage } = context;

  app.openapi(cataloguePictureRoute, async (context) => {
    const { size, file } = context.req.valid('param');
    const image =
      readImage === undefined ? null : await readImage(`${CATALOGUE_IMAGES}/${size}/${file}`);

    if (image === null) {
      return context.json(refuse('error.image.thatArtworkCouldNotBeRead'), 404);
    }

    return context.body(image.body, 200, {
      'content-type': image.contentType,
      'cache-control': PICTURE_CACHING,
    });
  });
};

export { serveCataloguePicture };
