import { mediaImageRoute } from '@ValenceServer/routes/ImageRoute';
import { artworkTagOf } from '@ValenceServer/api/artworkTagOf';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

const ARTWORK_CACHING = 'public, max-age=3600, stale-while-revalidate=604800';

/**
 * Registers the image endpoints.
 *
 * Artwork is kept for an hour and then checked again against a tag drawn from the picture's own
 * address, rather than held for a week as unchanging: an administrator can now choose a different
 * picture for a title at the same address, and a week-long promise meant nobody saw it. A check
 * costs a reply with no body, and the stale picture is shown while it is made.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveImage = (app: OpenAPIHono, context: AppContext): void => {
  const { library, readImage } = context;

  app.openapi(mediaImageRoute, async (context) => {
    const { mediaId, kind } = context.req.valid('param');

    const url = await library.readArtworkUrl(
      mediaId,
      kind,
      context.req.valid('query').of === 'title',
    );

    if (url === null || readImage === undefined) {
      return context.json(refuse('error.image.noArtworkForThatItem'), 404);
    }

    const tag = artworkTagOf(url);

    if (context.req.header('if-none-match') === tag) {
      return context.body(null, 304, { etag: tag, 'cache-control': ARTWORK_CACHING });
    }

    const image = await readImage(url);

    if (image === null) {
      return context.json(refuse('error.image.thatArtworkCouldNotBeRead'), 404);
    }

    return context.body(image.body, 200, {
      'content-type': image.contentType,
      'cache-control': ARTWORK_CACHING,
      etag: tag,
    });
  });
};

export { serveImage };
