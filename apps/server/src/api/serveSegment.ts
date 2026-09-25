import { say } from '@ValenceI18n/say';
import { listSegmentsRoute } from '@ValenceServer/routes/SegmentRoute';
import { registerMusicRoutes } from '@ValenceServer/music/registerMusicRoutes';
import { registerVideoDeviceRoutes } from '@ValenceServer/video/registerVideoDeviceRoutes';
import { registerReencodeRoutes } from '@ValenceServer/reencode/registerReencodeRoutes';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the segment endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveSegment = (app: OpenAPIHono, context: AppContext): void => {
  const {
    library,
    segments,
    music,
    videoDevices,
    reencodes,
    onReencodeQueued,
    requires,
    viewerOf,
    readAccount,
  } = context;

  app.openapi(listSegmentsRoute, async (context) => {
    const { mediaId } = context.req.valid('param');

    if ((await library.getMedia(mediaId)) === null) {
      return context.json({ error: say('server.errors.noSuchMediaItem') }, 404);
    }

    return context.json({ segments: await segments.list(mediaId) }, 200);
  });

  if (music !== undefined) {
    registerMusicRoutes(app, { viewerOf, music, requires });
  }

  if (videoDevices !== undefined) {
    registerVideoDeviceRoutes(app, { viewerOf, devices: videoDevices });
  }

  if (reencodes !== undefined) {
    registerReencodeRoutes(app, {
      reencodes,
      requires,
      accountOf: async (headers) => (await readAccount(headers))?.id ?? null,
      ...(onReencodeQueued === undefined ? {} : { onQueued: onReencodeQueued }),
    });
  }
};

export { serveSegment };
