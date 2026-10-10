import { describeDevice } from '@ValenceServer/account/describeDevice';
import { brandsOf } from '@ValenceServer/web/brandsOf';
import {
  listProgressRoute,
  recordProgressRoute,
  forgetProgressRoute,
} from '@ValenceServer/routes/ProgressRoute';
import { watchedBetween } from '@ValenceServer/progress/accumulateWatchTime';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the progress endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveProgress = (app: OpenAPIHono, context: AppContext): void => {
  const { library, progress, history, readProfileId } = context;

  app.openapi(listProgressRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    return context.json({ progress: await progress.list(profileId) }, 200);
  });

  app.openapi(recordProgressRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    const asked = context.req.valid('param').mediaId;

    const copy = await library.getMedia(asked);

    if (copy === null) {
      return context.json(refuse('error.common.noSuchMediaItem'), 404);
    }

    const isACopyFromElsewhere =
      copy.parentId !== null &&
      copy.parentId !== undefined &&
      (copy.extraKind ?? null) === null &&
      ((await library.list(asTheServer)).find((shelf) => shelf.id === copy.libraryId)
        ?.linkedServerId ?? null) !== null;
    const mediaId =
      isACopyFromElsewhere && copy.parentId !== undefined && copy.parentId !== null
        ? copy.parentId
        : asked;
    const item = mediaId === asked ? copy : ((await library.getMedia(mediaId)) ?? copy);

    if ((item.extraKind ?? null) !== null) {
      return context.body(null, 204);
    }

    const report = context.req.valid('json');

    const before = await progress.read(profileId, mediaId);
    const at = new Date();

    const secondsWatched =
      before === null
        ? 0
        : watchedBetween(
            {
              positionSeconds: before.positionSeconds,
              atMs: Date.parse(before.updatedAt),
              isPlaying: true,
            },
            { positionSeconds: report.positionSeconds, atMs: at.getTime(), isPlaying: true },
          );

    await progress.record(profileId, { mediaId, ...report });

    if (history !== undefined) {
      await history.record(profileId, mediaId, {
        at,
        secondsWatched,
        isFinished: report.isFinished,
        deviceLabel: describeDevice(
          context.req.header('user-agent') ?? null,
          brandsOf(context.req.header('sec-ch-ua')),
        ).message,
      });
    }

    return context.body(null, 204);
  });

  app.openapi(forgetProgressRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json(refuse('error.common.nobodyIsSignedIn'), 401);
    }

    await progress.forget(profileId, context.req.valid('param').mediaId);

    return context.body(null, 204);
  });
};

export { serveProgress };
