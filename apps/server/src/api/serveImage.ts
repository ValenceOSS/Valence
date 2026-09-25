import { say } from '@ValenceI18n/say';
import { mediaImageRoute } from '@ValenceServer/routes/ImageRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the image endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveImage = (app: OpenAPIHono, context: AppContext): void => {
  const { library, readImage } = context;

  app.openapi(mediaImageRoute, async (context) => {
    const { mediaId, kind } = context.req.valid('param');

    const url = await library.readArtworkUrl(mediaId, kind);

    if (url === null || readImage === undefined) {
      return context.json({ error: say('server.errors.noArtwork') }, 404);
    }

    const image = await readImage(url);

    if (image === null) {
      return context.json({ error: say('server.errors.artworkUnreadable') }, 404);
    }

    return context.body(image.body, 200, {
      'content-type': image.contentType,
      // eslint-disable-next-line valence/no-hard-coded-strings -- an HTTP header value
      'cache-control': 'public, max-age=604800, immutable',
    });
  });
};

export { serveImage };
