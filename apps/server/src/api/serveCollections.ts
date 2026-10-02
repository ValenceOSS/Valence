import { bodyOf } from '@ValenceI18n/bodyOf';
import { refuse } from '@ValenceI18n/refuse';
import { describePictureFault } from '@ValenceServer/profiles/describePictureFault';
import { ARTWORK_LIMITS } from '@ValenceServer/playlists/ARTWORK_LIMITS';
import {
  addCollectionEntriesRoute,
  createCollectionRoute,
  dropCollectionEntryRoute,
  listCollectionsRoute,
  moveCollectionEntryRoute,
  readCollectionRoute,
  removeCollectionRoute,
  replaceCollectionEntriesRoute,
  updateCollectionRoute,
} from '@ValenceServer/routes/CollectionRoute';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Viewer } from '@ValenceServer/visibility/Viewer';

const NOBODY = refuse('error.common.nobodyIsSignedIn');

const NOT_ALLOWED = refuse('common.thatIsForAdministrators');

const NO_SUCH_COLLECTION = refuse('error.collections.noSuchCollection');

/**
 * Registers the collection endpoints: reading collections for anybody signed in to an account, and
 * changing them for whoever may edit libraries.
 *
 * A share guest is turned away from all of it. What a guest may reach was decided when their link
 * was made, and a collection would otherwise be a way round that.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveCollections = (app: OpenAPIHono, context: AppContext): void => {
  const { collections, viewerOf, requires } = context;

  /**
   * Who is asking, where they are signed in to an account rather than following a share.
   *
   * @param headers - The request's headers.
   * @returns The viewer, or nothing.
   */
  const accountOf = async (
    headers: Headers,
  ): Promise<Extract<Viewer, { kind: 'account' }> | null> => {
    const viewer = await viewerOf(headers);

    return viewer?.kind === 'account' ? viewer : null;
  };

  app.openapi(listCollectionsRoute, async (context) => {
    const viewer = await accountOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(NOBODY, 401);
    }

    const { mediaId, seriesId, withEmpty } = context.req.valid('query');
    const containing =
      mediaId !== undefined
        ? { mediaItemId: mediaId }
        : seriesId !== undefined
          ? { seriesId }
          : undefined;
    const mayManage =
      withEmpty === 'true' && (await requires(context.req.raw.headers, 'library.edit'));

    return context.json(
      {
        collections:
          collections === undefined
            ? []
            : await collections.list(viewer, {
                ...(containing === undefined ? {} : { containing }),
                withEmpty: mayManage,
              }),
      },
      200,
    );
  });

  app.openapi(readCollectionRoute, async (context) => {
    const viewer = await accountOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(NOBODY, 401);
    }

    const found = await collections?.get(
      viewer,
      context.req.valid('param').collectionId,
      await requires(context.req.raw.headers, 'library.edit'),
    );

    return found === undefined || found === null
      ? context.json(NO_SUCH_COLLECTION, 404)
      : context.json(found, 200);
  });

  app.openapi(createCollectionRoute, async (context) => {
    const viewer = await accountOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(NOBODY, 401);
    }

    if (collections === undefined || !(await requires(context.req.raw.headers, 'library.edit'))) {
      return context.json(NOT_ALLOWED, 403);
    }

    const { name, description, isOrdered, entries } = context.req.valid('json');

    return context.json(
      await collections.create({
        name,
        description: description ?? null,
        ...(isOrdered === undefined ? {} : { isOrdered }),
        ...(entries === undefined ? {} : { entries }),
        createdBy: viewer.accountId,
      }),
      201,
    );
  });

  /**
   * Whether the one asking may change collections, and which refusal to answer with where not.
   *
   * @param headers - The request's headers.
   * @returns Nothing where they may, or the refusal and its status.
   */
  const refusalFor = async (headers: Headers) => {
    if ((await accountOf(headers)) === null) {
      return { body: NOBODY, status: 401 } as const;
    }

    if (collections === undefined || !(await requires(headers, 'library.edit'))) {
      return { body: NOT_ALLOWED, status: 403 } as const;
    }

    return null;
  };

  app.openapi(updateCollectionRoute, async (context) => {
    const refused = await refusalFor(context.req.raw.headers);

    if (refused !== null || collections === undefined) {
      return context.json(refused?.body ?? NOT_ALLOWED, refused?.status ?? 403);
    }

    const changed = await collections.update(
      context.req.valid('param').collectionId,
      context.req.valid('json'),
    );

    return changed === null ? context.json(NO_SUCH_COLLECTION, 404) : context.json(changed, 200);
  });

  app.openapi(removeCollectionRoute, async (context) => {
    const refused = await refusalFor(context.req.raw.headers);

    if (refused !== null || collections === undefined) {
      return context.json(refused?.body ?? NOT_ALLOWED, refused?.status ?? 403);
    }

    return (await collections.remove(context.req.valid('param').collectionId))
      ? context.body(null, 204)
      : context.json(NO_SUCH_COLLECTION, 404);
  });

  app.openapi(addCollectionEntriesRoute, async (context) => {
    const refused = await refusalFor(context.req.raw.headers);

    if (refused !== null || collections === undefined) {
      return context.json(refused?.body ?? NOT_ALLOWED, refused?.status ?? 403);
    }

    const added = await collections.add(
      context.req.valid('param').collectionId,
      context.req.valid('json').entries,
    );

    return added === null ? context.json(NO_SUCH_COLLECTION, 404) : context.json({ added }, 200);
  });

  app.openapi(replaceCollectionEntriesRoute, async (context) => {
    const refused = await refusalFor(context.req.raw.headers);

    if (refused !== null || collections === undefined) {
      return context.json(refused?.body ?? NOT_ALLOWED, refused?.status ?? 403);
    }

    return (await collections.replaceEntries(
      context.req.valid('param').collectionId,
      context.req.valid('json').entries,
    ))
      ? context.body(null, 204)
      : context.json(NO_SUCH_COLLECTION, 404);
  });

  app.openapi(moveCollectionEntryRoute, async (context) => {
    const refused = await refusalFor(context.req.raw.headers);

    if (refused !== null || collections === undefined) {
      return context.json(refused?.body ?? NOT_ALLOWED, refused?.status ?? 403);
    }

    const { collectionId, entryId } = context.req.valid('param');

    return (await collections.move(collectionId, entryId, context.req.valid('json').afterEntryId))
      ? context.body(null, 204)
      : context.json(refuse('error.collections.thatEntryIsNotInThatCollection'), 404);
  });

  app.openapi(dropCollectionEntryRoute, async (context) => {
    const refused = await refusalFor(context.req.raw.headers);

    if (refused !== null || collections === undefined) {
      return context.json(refused?.body ?? NOT_ALLOWED, refused?.status ?? 403);
    }

    const { collectionId, entryId } = context.req.valid('param');

    return (await collections.drop(collectionId, entryId))
      ? context.body(null, 204)
      : context.json(refuse('error.collections.thatEntryIsNotInThatCollection'), 404);
  });

  app.get('/api/collections/:collectionId/artwork', async (context) => {
    if ((await accountOf(context.req.raw.headers)) === null) {
      return context.json(NOBODY, 401);
    }

    const artwork = await collections?.readArtwork(context.req.param('collectionId'));

    if (artwork === undefined || artwork === null) {
      return context.json(refuse('error.collections.thatCollectionHasNoArtworkOf'), 404);
    }

    return context.body(artwork.body.slice().buffer, 200, {
      'content-type': artwork.contentType,
      'cache-control':
        context.req.query('v') === undefined
          ? 'private, max-age=60'
          : 'private, max-age=31536000, immutable',
    });
  });

  app.put('/api/collections/:collectionId/artwork', async (context) => {
    const refused = await refusalFor(context.req.raw.headers);

    if (refused !== null || collections === undefined) {
      return context.json(refused?.body ?? NOT_ALLOWED, refused?.status ?? 403);
    }

    if (Number(context.req.header('content-length') ?? 0) > ARTWORK_LIMITS.mostBytes) {
      return context.json(describePictureFault('tooLarge', ARTWORK_LIMITS), 413);
    }

    const wrong = await collections.saveArtwork(context.req.param('collectionId'), {
      body: new Uint8Array(await context.req.arrayBuffer()),
      contentType: context.req.header('content-type') ?? '',
    });

    if (wrong === 'missing' || wrong === 'notYours') {
      return context.json(NO_SUCH_COLLECTION, 404);
    }

    if (wrong !== null) {
      const said = describePictureFault(wrong, ARTWORK_LIMITS);

      return context.json(bodyOf(said), said.status);
    }

    return context.body(null, 204);
  });

  app.delete('/api/collections/:collectionId/artwork', async (context) => {
    const refused = await refusalFor(context.req.raw.headers);

    if (refused !== null || collections === undefined) {
      return context.json(refused?.body ?? NOT_ALLOWED, refused?.status ?? 403);
    }

    return (await collections.dropArtwork(context.req.param('collectionId')))
      ? context.body(null, 204)
      : context.json(NO_SUCH_COLLECTION, 404);
  });
};

export { serveCollections };
