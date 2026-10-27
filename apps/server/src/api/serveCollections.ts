import { tooBigToRead } from '@ValenceServer/api/tooBigToRead';
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

const NO_PROFILE = refuse('error.music.chooseAProfileFirst');

const FILLS_ITSELF = refuse('error.collections.aSmartCollectionFillsItself');

/**
 * Registers the collection endpoints: reading collections for anybody signed in to an account, and
 * changing the server's for whoever may edit libraries and a profile's own for that profile.
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

    const { name, description, isOrdered, entries, rules, isPersonal } = context.req.valid('json');

    if (isPersonal === true && viewer.profileId === null) {
      return context.json(NO_PROFILE, 401);
    }

    if (isPersonal === true && rules === undefined) {
      return context.json(refuse('error.collections.aCollectionForYourselfNeedsRules'), 400);
    }

    if (
      collections === undefined ||
      (isPersonal !== true && !(await requires(context.req.raw.headers, 'library.edit')))
    ) {
      return context.json(NOT_ALLOWED, 403);
    }

    return context.json(
      await collections.create(
        {
          name,
          description: description ?? null,
          ...(isOrdered === undefined ? {} : { isOrdered }),
          ...(entries === undefined ? {} : { entries }),
          ...(rules === undefined ? {} : { rules }),
          ...(isPersonal === true ? { profileId: viewer.profileId } : {}),
          createdBy: viewer.accountId,
        },
        viewer,
      ),
      201,
    );
  });

  /**
   * Whether the one asking may change a collection: the server's where they may edit libraries, a
   * profile's own where it is theirs, and anybody else's answering as though it were not there.
   *
   * @param headers - The request's headers.
   * @param collectionId - The collection.
   * @returns Who they are and what the collection is, or the refusal and its status.
   */
  const refusalFor = async (headers: Headers, collectionId: string) => {
    const viewer = await accountOf(headers);

    if (viewer === null) {
      return { body: NOBODY, status: 401 } as const;
    }

    const owned = await collections?.ownership(collectionId);

    if (owned === undefined || owned === null) {
      return { body: NO_SUCH_COLLECTION, status: 404 } as const;
    }

    if (owned.profileId !== null) {
      return owned.profileId === viewer.profileId
        ? { isSmart: owned.isSmart, isPersonal: true, viewer }
        : ({ body: NO_SUCH_COLLECTION, status: 404 } as const);
    }

    return (await requires(headers, 'library.edit'))
      ? { isSmart: owned.isSmart, isPersonal: false, viewer }
      : ({ body: NOT_ALLOWED, status: 403 } as const);
  };

  app.openapi(updateCollectionRoute, async (context) => {
    const { collectionId } = context.req.valid('param');
    const allowed = await refusalFor(context.req.raw.headers, collectionId);

    if ('body' in allowed || collections === undefined) {
      return 'body' in allowed
        ? context.json(allowed.body, allowed.status)
        : context.json(NOT_ALLOWED, 403);
    }

    const change = context.req.valid('json');

    if (change.rules !== undefined && !allowed.isSmart) {
      return context.json(refuse('error.collections.onlyASmartCollectionHasRules'), 409);
    }

    if (change.isShared !== undefined && !allowed.isPersonal) {
      return context.json(refuse('error.collections.onlyYourOwnCollectionsAreShared'), 409);
    }

    const changed = await collections.update(collectionId, change, allowed.viewer);

    return changed === null ? context.json(NO_SUCH_COLLECTION, 404) : context.json(changed, 200);
  });

  app.openapi(removeCollectionRoute, async (context) => {
    const { collectionId } = context.req.valid('param');
    const owned = await collections?.ownership(collectionId);
    const isSharedByAnother =
      owned !== undefined &&
      owned !== null &&
      owned.profileId !== null &&
      owned.isShared &&
      owned.profileId !== (await accountOf(context.req.raw.headers))?.profileId;
    const allowed =
      isSharedByAnother && (await requires(context.req.raw.headers, 'library.edit'))
        ? { isSmart: true }
        : await refusalFor(context.req.raw.headers, collectionId);

    if ('body' in allowed || collections === undefined) {
      return 'body' in allowed
        ? context.json(allowed.body, allowed.status)
        : context.json(NOT_ALLOWED, 403);
    }

    return (await collections.remove(collectionId))
      ? context.body(null, 204)
      : context.json(NO_SUCH_COLLECTION, 404);
  });

  app.openapi(addCollectionEntriesRoute, async (context) => {
    const { collectionId } = context.req.valid('param');
    const allowed = await refusalFor(context.req.raw.headers, collectionId);

    if ('body' in allowed || collections === undefined) {
      return 'body' in allowed
        ? context.json(allowed.body, allowed.status)
        : context.json(NOT_ALLOWED, 403);
    }

    if (allowed.isSmart) {
      return context.json(FILLS_ITSELF, 409);
    }

    const added = await collections.add(collectionId, context.req.valid('json').entries);

    return added === null ? context.json(NO_SUCH_COLLECTION, 404) : context.json({ added }, 200);
  });

  app.openapi(replaceCollectionEntriesRoute, async (context) => {
    const { collectionId } = context.req.valid('param');
    const allowed = await refusalFor(context.req.raw.headers, collectionId);

    if ('body' in allowed || collections === undefined) {
      return 'body' in allowed
        ? context.json(allowed.body, allowed.status)
        : context.json(NOT_ALLOWED, 403);
    }

    if (allowed.isSmart) {
      return context.json(FILLS_ITSELF, 409);
    }

    return (await collections.replaceEntries(collectionId, context.req.valid('json').entries))
      ? context.body(null, 204)
      : context.json(NO_SUCH_COLLECTION, 404);
  });

  app.openapi(moveCollectionEntryRoute, async (context) => {
    const { collectionId, entryId } = context.req.valid('param');
    const allowed = await refusalFor(context.req.raw.headers, collectionId);

    if ('body' in allowed || collections === undefined) {
      return 'body' in allowed
        ? context.json(allowed.body, allowed.status)
        : context.json(NOT_ALLOWED, 403);
    }

    if (allowed.isSmart) {
      return context.json(FILLS_ITSELF, 409);
    }

    return (await collections.move(collectionId, entryId, context.req.valid('json').afterEntryId))
      ? context.body(null, 204)
      : context.json(refuse('error.collections.thatEntryIsNotInThatCollection'), 404);
  });

  app.openapi(dropCollectionEntryRoute, async (context) => {
    const { collectionId, entryId } = context.req.valid('param');
    const allowed = await refusalFor(context.req.raw.headers, collectionId);

    if ('body' in allowed || collections === undefined) {
      return 'body' in allowed
        ? context.json(allowed.body, allowed.status)
        : context.json(NOT_ALLOWED, 403);
    }

    if (allowed.isSmart) {
      return context.json(FILLS_ITSELF, 409);
    }

    return (await collections.drop(collectionId, entryId))
      ? context.body(null, 204)
      : context.json(refuse('error.collections.thatEntryIsNotInThatCollection'), 404);
  });

  app.get('/api/collections/:collectionId/artwork', async (context) => {
    const viewer = await accountOf(context.req.raw.headers);

    if (viewer === null) {
      return context.json(NOBODY, 401);
    }

    const artwork = await collections?.readArtwork(viewer, context.req.param('collectionId'));

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

  app.put(
    '/api/collections/:collectionId/artwork',
    tooBigToRead(ARTWORK_LIMITS),
    async (context) => {
      const allowed = await refusalFor(context.req.raw.headers, context.req.param('collectionId'));

      if ('body' in allowed || collections === undefined) {
        return 'body' in allowed
          ? context.json(allowed.body, allowed.status)
          : context.json(NOT_ALLOWED, 403);
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
    },
  );

  app.delete('/api/collections/:collectionId/artwork', async (context) => {
    const allowed = await refusalFor(context.req.raw.headers, context.req.param('collectionId'));

    if ('body' in allowed || collections === undefined) {
      return 'body' in allowed
        ? context.json(allowed.body, allowed.status)
        : context.json(NOT_ALLOWED, 403);
    }

    return (await collections.dropArtwork(context.req.param('collectionId')))
      ? context.body(null, 204)
      : context.json(NO_SUCH_COLLECTION, 404);
  });
};

export { serveCollections };
