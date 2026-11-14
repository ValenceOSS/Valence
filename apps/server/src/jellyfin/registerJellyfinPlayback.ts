import { refuse } from '@ValenceI18n/refuse';
import { deviceProfileOfJellyfin } from '@ValenceServer/jellyfin/deviceProfileOfJellyfin';
import { jellyfinIdOf } from '@ValenceServer/jellyfin/jellyfinIdOf';
import { jellyfinMediaSourceOf } from '@ValenceServer/jellyfin/jellyfinMediaSourceOf';
import { JsonSchema } from '@ValenceServer/jellyfin/JsonSchema';
import { lowerKeysDeep } from '@ValenceServer/jellyfin/lowerKeysDeep';
import { secondsOfTicks } from '@ValenceServer/jellyfin/secondsOfTicks';
import { uuidOfJellyfinId } from '@ValenceServer/jellyfin/uuidOfJellyfinId';
import { valenceStreamIndexOf } from '@ValenceServer/jellyfin/valenceStreamIndexOf';
import {
  PlaybackInfoBodySchema,
  PlaybackInfoQuerySchema,
} from '@ValenceServer/jellyfin/JellyfinRequests';
import type { JellyfinApp, JellyfinContext } from '@ValenceServer/jellyfin/JellyfinApp';
import type { JellyfinBackend } from '@ValenceServer/jellyfin/JellyfinBackend';
import type { JellyfinPlays } from '@ValenceServer/jellyfin/createJellyfinPlays';

const MANIFEST = 'index.m3u8';

const PASSED_BACK = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
  'cache-control',
  'last-modified',
  'etag',
];

/**
 * Valence's answer passed back to a Jellyfin app as it came: its status, its body and the headers
 * a player reads.
 *
 * @param answer - Valence's answer.
 * @returns The same answer.
 */
const passedBack = (answer: Response): Response => {
  const headers = new Headers();

  for (const name of PASSED_BACK) {
    const value = answer.headers.get(name);

    if (value !== null) {
      headers.set(name, value);
    }
  }

  return new Response(answer.body, { status: answer.status, headers });
};

/**
 * Registers playback. Asking how to play something starts a Valence playback session for it,
 * negotiated from the app's own profile exactly as Valence's apps are: where the file can be
 * handed over as it is, the app streams it directly, and where it cannot, the app is handed the
 * session's stream at an address carrying a ticket for that session alone, since a player fetching
 * segments sends no token of its own.
 *
 * @param jellyfin - The Jellyfin endpoints.
 * @param backend - What they are answered with.
 * @param plays - The playback sessions Jellyfin apps started.
 */
const registerJellyfinPlayback = (
  jellyfin: JellyfinApp,
  backend: JellyfinBackend,
  plays: JellyfinPlays,
): void => {
  const playbackInfo = async (context: JellyfinContext): Promise<Response> => {
    const caller = context.get('caller');

    if (caller === null) {
      return context.body(null, 401);
    }

    const mediaId = uuidOfJellyfinId(context.req.param('itemId') ?? '');
    const detail = mediaId === null ? null : await backend.getMedia(caller, mediaId);

    if (mediaId === null || detail === null) {
      return context.json(refuse('error.common.noSuchMediaItem'), 404);
    }

    const read =
      context.req.method === 'POST'
        ? JsonSchema.safeParse(await context.req.json().catch(() => null))
        : null;
    const body = PlaybackInfoBodySchema.parse(
      read?.success === true ? lowerKeysDeep(read.data) : {},
    );
    const query = PlaybackInfoQuerySchema.parse(context.get('query'));
    const startTicks = body.starttimeticks ?? query.starttimeticks ?? 0;
    const audio = body.audiostreamindex ?? query.audiostreamindex;
    const subtitle = body.subtitlestreamindex ?? query.subtitlestreamindex;
    const { client, device } = caller.origin.client;
    const started = await backend.startPlayback(caller, mediaId, {
      deviceProfile: deviceProfileOfJellyfin(
        body.deviceprofile ?? null,
        // oxlint-disable-next-line valence/no-hard-coded-strings -- names the device profile in Valence's logs, not words for a person
        [client, device].filter((one) => one !== null).join(' · ') || 'Jellyfin',
        body.maxstreamingbitrate ?? query.maxstreamingbitrate ?? null,
        null,
      ),
      startSeconds: secondsOfTicks(startTicks),
      audioStreamIndex: valenceStreamIndexOf(audio ?? undefined),
      subtitleStreamIndex: valenceStreamIndexOf(subtitle ?? undefined),
    });

    if (started.kind === 'refused') {
      return context.json(started.refusal, started.status);
    }

    const playSessionId = plays.open({
      sessionId: started.sessionId,
      mediaId,
      profileId: caller.profile.id,
      durationSeconds: detail.durationSeconds,
      ticket: started.kind === 'hls' ? started.ticket : null,
    });
    const source = jellyfinMediaSourceOf(detail);
    const id = jellyfinIdOf(mediaId);

    return context.json({
      MediaSources: [
        started.kind === 'direct'
          ? {
              ...source,
              SupportsTranscoding: false,
              DirectStreamUrl: `/Videos/${id}/stream?static=true&MediaSourceId=${id}&PlaySessionId=${playSessionId}`,
            }
          : {
              ...source,
              SupportsDirectPlay: false,
              SupportsDirectStream: false,
              TranscodingUrl: `/Videos/${id}/hls/${started.ticket}/${MANIFEST}`,
              TranscodingSubProtocol: 'hls',
              TranscodingContainer: 'ts',
            },
      ],
      PlaySessionId: playSessionId,
    });
  };

  jellyfin.post('/items/:itemId/playbackinfo', playbackInfo);
  jellyfin.get('/items/:itemId/playbackinfo', playbackInfo);

  const stream = async (context: JellyfinContext): Promise<Response> => {
    const caller = context.get('caller');
    const mediaId = uuidOfJellyfinId(context.req.param('itemId') ?? '');

    if (caller === null) {
      return context.body(null, 401);
    }

    if (mediaId === null) {
      return context.json(refuse('error.common.noSuchMediaItem'), 404);
    }

    return passedBack(await backend.readDirectFile(caller, mediaId));
  };

  jellyfin.get('/videos/:itemId/stream', stream);
  jellyfin.get('/videos/:itemId/stream.:container', stream);

  jellyfin.get('/videos/:itemId/hls/:ticket/:name', async (context) =>
    passedBack(
      await backend.readSessionFile(
        context.get('origin'),
        context.req.param('ticket'),
        context.req.param('name'),
      ),
    ),
  );

  const manifest = (context: JellyfinContext): Response => {
    const caller = context.get('caller');
    const play =
      caller === null
        ? null
        : plays.read(context.get('query')['playsessionid'] ?? '', caller.profile.id);

    if (play?.ticket === null || play === null) {
      return context.json(refuse('error.playback.noSuchSessionOrSegment'), 404);
    }

    return context.redirect(`../${jellyfinIdOf(play.mediaId)}/hls/${play.ticket}/${MANIFEST}`, 302);
  };

  jellyfin.get('/videos/:itemId/master.m3u8', manifest);
  jellyfin.get('/videos/:itemId/main.m3u8', manifest);

  jellyfin.delete('/videos/activeencodings', async (context) => {
    const caller = context.get('caller');
    const playSessionId = context.get('query')['playsessionid'] ?? '';
    const play = caller === null ? null : plays.read(playSessionId, caller.profile.id);

    if (caller !== null && play !== null) {
      await backend.stopPlayback(caller, play.sessionId);
      plays.close(playSessionId);
    }

    return context.body(null, 204);
  });
};

export { registerJellyfinPlayback };
