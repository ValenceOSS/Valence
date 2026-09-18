import {
  cancelReencodeRoute,
  confirmReencodeRoute,
  estimateReencodeRoute,
  listReencodesRoute,
  listRenditionsRoute,
  rejectReencodeRoute,
  removeRenditionRoute,
  reviewFrameRoute,
  sampleReencodeRoute,
  startReencodeRoute,
} from '@ValenceServer/routes/ReencodeRoute';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { Permission } from '@ValenceContracts/schemas/Permission';
import type { ReencodeService } from './ReencodeService';

const MAY_NOT = { error: 'That is for administrators.' } as const;

const NO_SUCH = { error: 'No such re-encode.' } as const;

type ReencodeRouteOptions = {
  reencodes: ReencodeService;
  requires: (headers: Headers, permission: Permission) => Promise<boolean>;
  accountOf: (headers: Headers) => Promise<string | null>;
  onQueued?: () => void;
};

/**
 * Puts re-encoding on the API.
 *
 * Every route here is behind `media.reencode` rather than behind administration in general, because
 * replacing a file is the only thing in Valence that destroys the operator's own media. Resetting a
 * library deletes rows that a rescan brings back; this deletes a remux, and the detail a lossy
 * encoder discards does not come back at all. A household where somebody may tidy the artwork is
 * not thereby a household where they may re-encode the films.
 *
 * Reading what is kept beside an item is behind the same permission, which is stricter than it
 * needs to be for a listing — but the list is only ever read by the screen that acts on it.
 *
 * @param app - The application to register on.
 * @param options - The service, how to check a permission, and who is asking.
 */
const registerReencodeRoutes = (
  app: OpenAPIHono,
  { reencodes, requires, accountOf, onQueued }: ReencodeRouteOptions,
): void => {
  app.openapi(estimateReencodeRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.reencode'))) {
      return context.json(MAY_NOT, 403);
    }

    const { mediaIds, ...settings } = context.req.valid('json');

    return context.json(await reencodes.estimate(mediaIds, settings), 200);
  });

  app.openapi(startReencodeRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.reencode'))) {
      return context.json(MAY_NOT, 403);
    }

    const { mediaIds, ...settings } = context.req.valid('json');
    const started = await reencodes.start(
      mediaIds,
      settings,
      await accountOf(context.req.raw.headers),
    );

    if (started.started.length > 0) {
      onQueued?.();
    }

    return context.json(started, 202);
  });

  app.openapi(listReencodesRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.reencode'))) {
      return context.json(MAY_NOT, 403);
    }

    return context.json({ reencodes: await reencodes.list() }, 200);
  });

  app.openapi(cancelReencodeRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.reencode'))) {
      return context.json(MAY_NOT, 403);
    }

    const done = await reencodes.cancel(context.req.valid('param').id);

    return done ? context.json({ done }, 200) : context.json(NO_SUCH, 404);
  });

  app.openapi(confirmReencodeRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.reencode'))) {
      return context.json(MAY_NOT, 403);
    }

    const done = await reencodes.confirm(context.req.valid('param').id);

    if (done) {
      onQueued?.();
    }

    return done ? context.json({ done }, 200) : context.json(NO_SUCH, 404);
  });

  app.openapi(rejectReencodeRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.reencode'))) {
      return context.json(MAY_NOT, 403);
    }

    const done = await reencodes.reject(context.req.valid('param').id);

    if (done) {
      onQueued?.();
    }

    return done ? context.json({ done }, 200) : context.json(NO_SUCH, 404);
  });

  app.openapi(sampleReencodeRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.reencode'))) {
      return context.json(MAY_NOT, 403);
    }

    const done = await reencodes.sample(context.req.valid('param').id);

    return done ? context.json({ done }, 202) : context.json(NO_SUCH, 404);
  });

  app.openapi(reviewFrameRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.reencode'))) {
      return context.json(MAY_NOT, 403);
    }

    const { id } = context.req.valid('param');
    const { side, seconds, width } = context.req.valid('query');
    const frame = await reencodes.frame(id, side, seconds, width);

    if (frame === null) {
      return context.json({ error: 'No frame there.' }, 404);
    }

    return context.body(frame, 200, {
      'content-type': 'image/jpeg',
      'cache-control': 'private, max-age=60',
    });
  });

  app.openapi(listRenditionsRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.reencode'))) {
      return context.json(MAY_NOT, 403);
    }

    return context.json(
      { renditions: await reencodes.renditionsFor(context.req.valid('param').mediaId) },
      200,
    );
  });

  app.openapi(removeRenditionRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.reencode'))) {
      return context.json(MAY_NOT, 403);
    }

    const done = await reencodes.removeRendition(context.req.valid('param').id);

    return done ? context.json({ done }, 200) : context.json({ error: 'No such rendition.' }, 404);
  });
};

export type { ReencodeRouteOptions };

export { registerReencodeRoutes };
