import type { PreviewRead } from '@ValenceServer/playback/PlaybackService';
import {
  explainRoute,
  startRoute,
  sessionFileRoute,
  directFileRoute,
  trickplayRoute,
  trickplayFileRoute,
  frameRoute,
  stopRoute,
  heartbeatRoute,
} from '@ValenceServer/routes/PlaybackRoute';
import { SHARE_COOKIE } from '@ValenceServer/sharing/createShareGate';
import { getCookie } from 'hono/cookie';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the playback endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const servePlayback = (app: OpenAPIHono, context: AppContext): void => {
  const {
    library,
    playback,
    presence,
    shares,
    shareSessions,
    playbackSessions,
    forwardedFileHeaders,
    neverKeep,
    readProfileId,
    isTheSessionOfWhoeverIsAsking,
    isTheDeviceOfWhoeverIsAsking,
  } = context;

  app.openapi(explainRoute, async (context) => {
    const { mediaId } = context.req.valid('param');
    const { deviceProfile, requestedQuality } = context.req.valid('json');

    const explanation = await playback.explain(mediaId, deviceProfile, requestedQuality);

    if (explanation === null) {
      return context.json({ error: 'No such media item.' }, 404);
    }

    return context.json(explanation, 200);
  });

  app.openapi(startRoute, async (context) => {
    const { mediaId } = context.req.valid('param');
    const {
      deviceProfile,
      clientId,
      startSeconds,
      audioStreamIndex,
      requestedQuality,
      subtitleStreamIndex,
    } = context.req.valid('json');

    const outcome = await playback.start(
      mediaId,
      deviceProfile,
      startSeconds ?? 0,
      audioStreamIndex,
      requestedQuality,
      clientId,
      subtitleStreamIndex,
    );

    if (outcome.kind === 'notFound') {
      return context.json({ error: 'No such media item.' }, 404);
    }

    if (outcome.kind === 'unsupported') {
      return context.json({ error: outcome.reason }, 422);
    }

    if (outcome.kind === 'failed') {
      return context.json({ error: outcome.reason }, 500);
    }

    const openedBy = getCookie(context, SHARE_COOKIE);

    if (openedBy !== undefined && shares !== undefined && shareSessions !== undefined) {
      const held = await shares.resolve(openedBy);

      if (held !== null) {
        shareSessions.claim(outcome.session.sessionId, held.id);
      }
    }

    const startedBy = await readProfileId(context.req.raw.headers);

    if (startedBy !== null) {
      playbackSessions?.claim(outcome.session.sessionId, startedBy);
    }

    const isTheirOwnDevice = await isTheDeviceOfWhoeverIsAsking(context.req.raw.headers, clientId);

    if (clientId !== undefined && isTheirOwnDevice) {
      const item = await library.getMedia(mediaId);

      if (item !== null) {
        presence.startPlayback(clientId, {
          mediaId,
          mediaTitle: item.title,
          hasPoster: item.metadata.hasPoster,
          hasBackdrop: item.metadata.hasBackdrop,
          mode: outcome.session.delivery.kind === 'direct' ? 'direct' : 'transcode',
          reuse: outcome.session.reuse,
          transcoderSessionId:
            outcome.session.delivery.kind === 'hls' ? outcome.session.sessionId : null,
          plan: outcome.session.plan,
        });
      }
    }

    return context.json(outcome.session, 200);
  });

  app.openapi(sessionFileRoute, async (context) => {
    const { sessionId, name } = context.req.valid('param');

    if (!(await isTheSessionOfWhoeverIsAsking(context.req.raw.headers, sessionId))) {
      return context.json({ error: 'That session belongs to somebody else.' }, 403);
    }

    const file = await playback.readSessionFile(sessionId, name);

    if (file === null) {
      return context.json({ error: 'No such session or segment.' }, 404);
    }

    return context.body(file.body, 200, forwardedFileHeaders(file, neverKeep()));
  });

  app.openapi(directFileRoute, async (context) => {
    const { mediaId } = context.req.valid('param');
    const range = context.req.header('range') ?? null;

    const file = await playback.readDirectFile(mediaId, range);

    if (file === null) {
      return context.json({ error: 'No such media item.' }, 404);
    }

    return context.body(file.body, file.status === 206 ? 206 : 200, forwardedFileHeaders(file));
  });

  app.openapi(trickplayRoute, async (context) => {
    const { mediaId } = context.req.valid('param');

    try {
      const thumbnails = await playback.trickplay(mediaId);

      if (thumbnails === null) {
        return context.json({ error: 'No such media item.' }, 404);
      }

      return context.json(thumbnails, 200);
    } catch {
      return context.json({ error: 'The thumbnails could not be rendered.' }, 500);
    }
  });

  app.openapi(frameRoute, async (context) => {
    const { mediaId } = context.req.valid('param');
    const { seconds, width } = context.req.valid('query');

    const frame = await playback.readFrame(mediaId, seconds, width);

    if (frame === null) {
      return context.json({ error: 'No frame there.' }, 404);
    }

    return context.body(frame, 200, {
      'content-type': 'image/jpeg',
      'cache-control': 'public, max-age=31536000, immutable',
    });
  });

  app.get('/api/media/:mediaId/preview', async (context) => {
    const read = await playback
      .readPreview(context.req.param('mediaId'), context.req.header('range') ?? null)
      .catch((): PreviewRead => ({ kind: 'absent' }));

    if (read.kind === 'pending') {
      return context.json({ status: 'generating' }, 202, { 'cache-control': 'no-store' });
    }

    if (read.kind === 'absent') {
      return context.json({ error: 'No preview yet.' }, 404);
    }

    return context.body(
      read.file.body,
      read.file.status === 206 ? 206 : 200,
      forwardedFileHeaders(read.file, { 'cache-control': 'public, max-age=86400' }),
    );
  });

  app.openapi(trickplayFileRoute, async (context) => {
    const { trickplayId, name } = context.req.valid('param');

    const file = await playback.readTrickplayFile(trickplayId, name);

    if (file === null) {
      return context.json({ error: 'No such thumbnails.' }, 404);
    }

    return context.body(file.body, 200, { 'content-type': file.contentType });
  });

  app.openapi(stopRoute, async (context) => {
    const { sessionId } = context.req.valid('param');
    const { clientId } = context.req.valid('query');

    if (!(await isTheDeviceOfWhoeverIsAsking(context.req.raw.headers, clientId))) {
      return context.json({ error: 'That is not your device.' }, 403);
    }

    const stopped = await playback.stop(sessionId, clientId);

    const letGoBy = getCookie(context, SHARE_COOKIE);

    if (letGoBy !== undefined && shares !== undefined && shareSessions !== undefined) {
      const held = await shares.resolve(letGoBy);

      if (held !== null) {
        shareSessions.release(sessionId, held.id);
      }
    }

    const letGoByProfile = await readProfileId(context.req.raw.headers);

    if (letGoByProfile !== null) {
      playbackSessions?.release(sessionId, letGoByProfile);
    }

    if (!stopped) {
      return context.json({ error: 'No such session.' }, 404);
    }

    return context.body(null, 204);
  });

  app.openapi(heartbeatRoute, async (context) => {
    const { sessionId } = context.req.valid('param');
    const { clientId } = context.req.valid('query');
    const { isPlaying } = context.req.valid('json');

    if (!(await isTheDeviceOfWhoeverIsAsking(context.req.raw.headers, clientId))) {
      return context.json({ error: 'That is not your device.' }, 403);
    }

    const known = await playback.heartbeat(sessionId, isPlaying);

    if (!known) {
      return context.json({ error: 'No such session.' }, 404);
    }

    return context.body(null, 204);
  });
};

export { servePlayback };
