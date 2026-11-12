import { mediaImageRoute } from '@ValenceServer/routes/ImageRoute';
import { artworkTagOf } from '@ValenceServer/api/artworkTagOf';
import { ARTWORK_WIDTHS } from '@ValenceContracts/constants/ARTWORK_WIDTHS';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

const ARTWORK_CACHING = 'public, max-age=3600, stale-while-revalidate=604800';

const REDIRECT_CACHING = 'private, max-age=3600';

/**
 * Registers the image endpoints.
 *
 * Artwork is kept for an hour and then checked again against a tag drawn from the picture's own
 * address, rather than held for a week as unchanging: an administrator can now choose a different
 * picture for a title at the same address, and a week-long promise meant nobody saw it. A check
 * costs a reply with no body, and the stale picture is shown while it is made.
 *
 * A grid asks for a narrower copy, which carries a tag of its own so a browser holding the whole
 * picture is not told it already has the narrow one.
 *
 * A poster with no lettering, for a page that writes the title over it, is looked for in the
 * library's own catalogue, never the requests service's, so a server without requests has it too.
 *
 * A narrower copy is not sent from here at all where pictures are named: the browser is sent on to
 * the address it is served by name, which never changes and which a proxy or a CDN in front of the
 * server can answer straight from its own copy. The browser keeps where it was sent for an hour, so
 * a new picture chosen for a title is shown within the hour.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveImage = (app: OpenAPIHono, context: AppContext): void => {
  const { library, readImage, artworkNames, artworkAddress } = context;

  app.openapi(mediaImageRoute, async (context) => {
    const { mediaId, kind } = context.req.valid('param');
    const { of, lettering, size } = context.req.valid('query');

    const url =
      lettering === 'none'
        ? kind === 'poster'
          ? await library.readBarePosterUrl(mediaId)
          : null
        : await library.readArtworkUrl(mediaId, kind, of === 'title');

    if (url === null || readImage === undefined) {
      return context.json(refuse('error.image.noArtworkForThatItem'), 404);
    }

    if (size !== undefined && artworkNames !== undefined) {
      const name = artworkNames.nameOf(url);

      context.header('cache-control', REDIRECT_CACHING);

      return context.redirect(
        `${artworkAddress}/api/artwork/${name}-w${ARTWORK_WIDTHS[size].toString()}.webp`,
        302,
      );
    }

    const tag = artworkTagOf(size === undefined ? url : `${url}#${size}`);

    if (context.req.header('if-none-match') === tag) {
      return context.body(null, 304, { etag: tag, 'cache-control': ARTWORK_CACHING });
    }

    const image = await readImage(url, size === undefined ? undefined : ARTWORK_WIDTHS[size]);

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
