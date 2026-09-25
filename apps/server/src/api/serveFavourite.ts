import { say } from '@ValenceI18n/say';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import {
  listFavouritesRoute,
  keepFavouriteRoute,
  dropFavouriteRoute,
  keepBookFavouriteRoute,
  dropBookFavouriteRoute,
} from '@ValenceServer/routes/FavouriteRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the favourite endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveFavourite = (app: OpenAPIHono, context: AppContext): void => {
  const { library, favourites, music, bookInReach, readProfileId } = context;

  app.openapi(listFavouritesRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    return context.json(
      {
        favourites: await favourites.list(profileId),
        books: await favourites.listBooks(profileId),
      },
      200,
    );
  });

  app.openapi(keepFavouriteRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { mediaId } = context.req.valid('param');
    const isTrack =
      music !== undefined && (await music.library.listTracks(asTheServer, [mediaId])).length > 0;

    if (!isTrack && (await library.getMedia(mediaId)) === null) {
      return context.json({ error: say('server.errors.noSuchMediaItem') }, 404);
    }

    await favourites.keep(profileId, mediaId);

    return context.body(null, 204);
  });

  app.openapi(dropFavouriteRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    await favourites.drop(profileId, context.req.valid('param').mediaId);

    return context.body(null, 204);
  });

  app.openapi(keepBookFavouriteRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { bookId } = context.req.valid('param');

    if (!(await bookInReach(context.req.raw.headers, bookId))) {
      return context.json({ error: say('server.errors.noSuchBook') }, 404);
    }

    await favourites.keepBook(profileId, bookId);

    return context.body(null, 204);
  });

  app.openapi(dropBookFavouriteRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    await favourites.dropBook(profileId, context.req.valid('param').bookId);

    return context.body(null, 204);
  });
};

export { serveFavourite };
