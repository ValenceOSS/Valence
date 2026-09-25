import { say } from '@ValenceI18n/say';
import {
  listProgressRoute,
  recordProgressRoute,
  forgetProgressRoute,
} from '@ValenceServer/routes/ProgressRoute';
import { watchedBetween } from '@ValenceServer/progress/accumulateWatchTime';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

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
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    return context.json({ progress: await progress.list(profileId) }, 200);
  });

  app.openapi(recordProgressRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const { mediaId } = context.req.valid('param');

    const item = await library.getMedia(mediaId);

    if (item === null) {
      return context.json({ error: say('server.errors.noSuchMediaItem') }, 404);
    }

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
      });
    }

    return context.body(null, 204);
  });

  app.openapi(forgetProgressRoute, async (context) => {
    const profileId = await readProfileId(context.req.raw.headers);

    if (profileId === null) {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    await progress.forget(profileId, context.req.valid('param').mediaId);

    return context.body(null, 204);
  });
};

export { serveProgress };
