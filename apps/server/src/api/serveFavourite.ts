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
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the favourite endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveFavourite = (app: OpenAPIHono, context: AppContext): void => {
  const { library, favourites, music, bookInReach, readProfileId, realtime } = context;

  /**
   * Tells every screen this profile has open that what it keeps has changed, so a song liked on a
   * phone fills its heart on the television.
   *
   * @param profileId - Whose list changed.
   */
  const tellTheirScreens = (profileId: string): void => {
    realtime?.publish(
      'profile',
      { event: 'favourites' },
      { kind: 'profiles', profileIds: [profileId] },
    );
  };

  app.openapi(listFavouritesRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
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
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const { mediaId } = context.req.valid('param');
    const isTrack =
      music !== undefined && (await music.library.listTracks(asTheServer, [mediaId])).length > 0;

    if (!isTrack && (await library.getMedia(mediaId)) === null) {
      return context.json(refuse('error.common.noSuchMediaItem'), 404);
    }

    await favourites.keep(profileId, mediaId);
    tellTheirScreens(profileId);

    return context.body(null, 204);
  });

  app.openapi(dropFavouriteRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    await favourites.drop(profileId, context.req.valid('param').mediaId);
    tellTheirScreens(profileId);

    return context.body(null, 204);
  });

  app.openapi(keepBookFavouriteRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const { bookId } = context.req.valid('param');

    if (!(await bookInReach(context.req.raw.headers, bookId))) {
      return context.json(refuse('error.common.noSuchBook'), 404);
    }

    await favourites.keepBook(profileId, bookId);
    tellTheirScreens(profileId);

    return context.body(null, 204);
  });

  app.openapi(dropBookFavouriteRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    await favourites.dropBook(profileId, context.req.valid('param').bookId);
    tellTheirScreens(profileId);

    return context.body(null, 204);
  });
};

export { serveFavourite };
