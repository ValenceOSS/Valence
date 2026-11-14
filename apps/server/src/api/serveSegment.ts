import { savedSegmentsOf } from '@ValenceServer/segments/savedSegmentsOf';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { SetSegmentsSchema } from '@ValenceContracts/schemas/MediaSegment';
import { listChaptersRoute, listSegmentsRoute } from '@ValenceServer/routes/SegmentRoute';
import { registerMusicRoutes } from '@ValenceServer/music/registerMusicRoutes';
import { registerVideoDeviceRoutes } from '@ValenceServer/video/registerVideoDeviceRoutes';
import { registerReencodeRoutes } from '@ValenceServer/reencode/registerReencodeRoutes';
import { registerPreTranscodingRoutes } from '@ValenceServer/preTranscoding/registerPreTranscodingRoutes';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

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
    preTranscoding,
    requires,
    viewerOf,
    peerRequests,
    readAccount,
    recordAudit,
  } = context;

  app.openapi(listSegmentsRoute, async (context) => {
    const { mediaId } = context.req.valid('param');

    if ((await library.getMedia(mediaId)) === null) {
      return context.json(refuse('error.common.noSuchMediaItem'), 404);
    }

    return context.json({ segments: await segments.list(mediaId) }, 200);
  });

  app.put('/api/media/:mediaId/segments', async (context) => {
    if (!(await requires(context.req.raw.headers, 'media.override'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 404);
    }

    const mediaId = context.req.param('mediaId');
    const body = JsonValueSchema.safeParse(await context.req.json().catch(() => null));
    const asked = SetSegmentsSchema.safeParse(body.success ? body.data : null);

    if (!asked.success) {
      return context.json(refuse('error.segments.thoseMarkersCouldNotBeRead'), 400);
    }

    await segments.replace(
      mediaId,
      savedSegmentsOf(await segments.list(mediaId), asked.data.segments),
    );

    return context.json({ segments: await segments.list(mediaId) }, 200);
  });

  app.openapi(listChaptersRoute, async (context) => {
    const { mediaId } = context.req.valid('param');

    if ((await library.getMedia(mediaId)) === null) {
      return context.json(refuse('error.common.noSuchMediaItem'), 404);
    }

    return context.json({ chapters: await segments.chapters(mediaId) }, 200);
  });

  if (music !== undefined) {
    registerMusicRoutes(app, {
      viewerOf,
      music,
      requires,
      peerOf: (headers) => peerRequests.get(headers),
    });
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

  if (preTranscoding !== undefined) {
    registerPreTranscodingRoutes(app, {
      preTranscoding,
      requires,
      accountOf: async (headers) => (await readAccount(headers))?.id ?? null,
      recordAudit,
    });
  }
};

export { serveSegment };
