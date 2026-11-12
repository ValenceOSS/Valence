import { artworkRoute } from '@ValenceServer/routes/ArtworkRoute';
import { ARTWORK_WIDTHS } from '@ValenceContracts/constants/ARTWORK_WIDTHS';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

const KEPT_FOR_GOOD = 'public, max-age=31536000, immutable';

const WIDTHS: ReadonlySet<number> = new Set(Object.values(ARTWORK_WIDTHS));

/**
 * Registers the address pictures are served from by name, which anybody may fetch: the name is a
 * key only this server can work out from a picture's address, and a picture never changes under its
 * name, so it is kept by browsers and proxies for good.
 *
 * @param app - The application to register it on.
 * @param context - What it is answered with.
 */
const serveArtwork = (app: OpenAPIHono, context: AppContext): void => {
  const { artworkNames, readImage } = context;

  app.openapi(artworkRoute, async (context) => {
    const { file } = context.req.valid('param');
    const [name = '', widthPart = ''] = file.replace(/\.webp$/u, '').split('-w');
    const width = Number(widthPart);
    const url =
      artworkNames === undefined || !WIDTHS.has(width) ? null : await artworkNames.urlOf(name);
    const image = url === null || readImage === undefined ? null : await readImage(url, width);

    if (image === null || image.contentType !== 'image/webp') {
      return context.json(refuse('error.image.noArtworkForThatItem'), 404);
    }

    return context.body(image.body, 200, {
      'content-type': image.contentType,
      'cache-control': KEPT_FOR_GOOD,
    });
  });
};

export { serveArtwork };
