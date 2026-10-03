import {
  ExplainResponse,
  StartResponse,
  TrickplayResponse,
} from '@ValenceServer/routes/PlaybackRoute';
import { LINKED_SESSION } from './LINKED_SESSION';
import { saidOfRefusal } from './saidOfRefusal';
import { PeerAsksSchema } from './PeerAskSchema';
import type { PeerAsk } from './PeerAskSchema';
import { FEDERATION_PATH } from '@ValenceServer/linking/FEDERATION_PATH';
import { z } from 'zod';
import type { PlaybackService } from '@ValenceServer/playback/PlaybackService';
import type { LinkedAsker } from './createLinkedAsker';

type LinkedTitle = { serverId: string; remoteId: string };

const JSON_SENT = { 'content-type': 'application/json' };

const TicketSchema = z.object({ ticket: z.string().min(1) });

/**
 * A session or set of thumbnails started on a linked server, under a name of this server's own:
 * which server it is on and what that server calls it.
 *
 * @param serverId - The linked server.
 * @param remoteId - What it calls the session.
 * @returns The name here.
 */
const linkedNameOf = (serverId: string, remoteId: string) =>
  `${LINKED_SESSION}${serverId}~${remoteId}`;

/**
 * Reads a name made by `linkedNameOf`.
 *
 * @param name - The name here.
 * @returns The server and what it calls the session, or nothing where it is this server's own.
 */
const readLinkedName = (name: string): LinkedTitle | null => {
  if (!name.startsWith(LINKED_SESSION)) {
    return null;
  }

  const [serverId, ...rest] = name.slice(LINKED_SESSION.length).split('~');

  return serverId === undefined || rest.length === 0
    ? null
    : { serverId, remoteId: rest.join('~') };
};

/**
 * Something sent as JSON.
 *
 * @param body - What to send.
 * @returns The request's method, headers and body.
 */
const sendingJson = (body: object) => ({
  method: 'POST',
  headers: new Headers(JSON_SENT),
  body: new TextEncoder().encode(JSON.stringify(body)).buffer,
});

/**
 * The parts of a streamed answer a route passes on.
 *
 * @param answered - The answer.
 * @returns Its body, type, range and length.
 */
const streamedOf = (answered: Response & { body: ReadableStream<Uint8Array> }) => ({
  body: answered.body,
  contentType: answered.headers.get('content-type') ?? 'application/octet-stream',
  contentRange: answered.headers.get('content-range'),
  contentLength: answered.headers.get('content-length'),
});

/**
 * Whether an answer came back with something to read.
 *
 * @param answered - The answer.
 */
const hasBody = (
  answered: Response | null,
): answered is Response & { body: ReadableStream<Uint8Array> } =>
  answered !== null && answered.ok && answered.body !== null;

/**
 * Playback that plays this server's own titles as it always has, and a title a linked server shares
 * by asking that server: it decides how to play it, transcodes it under its own limits, and sends
 * the manifest, segments, file, thumbnails and frames, which this server passes on as they come. A
 * session started there is known here by a name of this server's own, and every address it hands
 * back is made this server's, so a player only ever talks to the server it is signed in to, and
 * never learns another is there.
 *
 * @param local - This server's own playback.
 * @param linkedTitleOf - Which linked server a title is from and what it calls it, or nothing
 *   where it is this server's own.
 * @param asker - How a linked server is asked.
 * @param onAsked - Told what the linked server's admin asked of somebody watching from it — to
 *   pause, to stop, a message — which comes back with a heartbeat, by the device it is playing on.
 * @param directFrom - Where a linked server is reached, where this server's admin chose for its
 *   streams to be fetched from there directly rather than through this server, or nothing.
 * @returns The playback.
 */
const createLinkedPlayback = (
  local: PlaybackService,
  linkedTitleOf: (mediaId: string) => Promise<LinkedTitle | null>,
  asker: LinkedAsker,
  onAsked: (deviceId: string, serverId: string, asks: readonly PeerAsk[]) => void = () => undefined,
  directFrom: (serverId: string) => Promise<string | null> = () => Promise.resolve(null),
): PlaybackService => {
  const ticketFor = async (
    serverId: string,
    asked: { sessionId: string } | { mediaId: string },
  ) => {
    const answered = await asker.ask(serverId, '/direct', sendingJson(asked));
    const read = answered?.ok === true ? TicketSchema.safeParse(await answered.json()) : null;

    return read?.success === true ? read.data.ticket : null;
  };

  const devices = new Map<string, string>();

  return {
    explain: async (mediaId, profile, requestedQuality) => {
      const linked = await linkedTitleOf(mediaId);

      if (linked === null) {
        return local.explain(mediaId, profile, requestedQuality);
      }

      const answered = await asker.ask(
        linked.serverId,
        `/api/playback/${linked.remoteId}/explain`,
        sendingJson({
          deviceProfile: profile,
          ...(requestedQuality === undefined ? {} : { requestedQuality }),
        }),
      );
      const read = answered?.ok === true ? ExplainResponse.safeParse(await answered.json()) : null;

      return read?.success === true ? { ...read.data, plan: { ...read.data.plan, mediaId } } : null;
    },

    start: async (
      mediaId,
      profile,
      startSeconds,
      audioStreamIndex,
      requestedQuality,
      deviceId,
      subtitleStreamIndex,
    ) => {
      const linked = await linkedTitleOf(mediaId);

      if (linked === null) {
        return local.start(
          mediaId,
          profile,
          startSeconds,
          audioStreamIndex,
          requestedQuality,
          deviceId,
          subtitleStreamIndex,
        );
      }

      const answered = await asker.ask(
        linked.serverId,
        `/api/playback/${linked.remoteId}/session`,
        sendingJson({
          deviceProfile: profile,
          startSeconds: Math.max(0, Math.floor(startSeconds)),
          ...(audioStreamIndex === undefined ? {} : { audioStreamIndex }),
          ...(requestedQuality === undefined ? {} : { requestedQuality }),
          ...(subtitleStreamIndex === undefined ? {} : { subtitleStreamIndex }),
        }),
      );

      if (answered === null || !answered.ok) {
        if (answered?.status === 404) {
          return { kind: 'notFound' };
        }

        const reason = await saidOfRefusal(answered);

        return answered?.status === 422 || answered?.status === 429
          ? { kind: 'unsupported', reason }
          : { kind: 'failed', reason };
      }

      const read = StartResponse.safeParse(await answered.json());

      if (!read.success) {
        return { kind: 'failed', reason: await saidOfRefusal(null) };
      }

      const started = read.data;
      const here = linkedNameOf(linked.serverId, started.sessionId);

      if (deviceId !== undefined) {
        devices.set(here, deviceId);
      }

      const direct = await directFrom(linked.serverId);
      const ticket =
        direct === null
          ? null
          : await ticketFor(
              linked.serverId,
              started.delivery.kind === 'hls'
                ? { sessionId: started.sessionId }
                : { mediaId: linked.remoteId },
            );

      if (direct !== null && ticket !== null) {
        const directly = `${direct}${FEDERATION_PATH}/direct/${ticket}`;

        return {
          kind: 'started',
          session: {
            ...started,
            plan: { ...started.plan, mediaId },
            sessionId: here,
            delivery:
              started.delivery.kind === 'hls'
                ? {
                    kind: 'hls',
                    manifestUrl: `${directly}/${started.delivery.manifestUrl.split('/').at(-1) ?? ''}`,
                  }
                : { kind: 'direct', url: `${directly}/file` },
          },
        };
      }

      return {
        kind: 'started',
        session: {
          ...started,
          plan: { ...started.plan, mediaId },
          sessionId: here,
          delivery:
            started.delivery.kind === 'hls'
              ? {
                  kind: 'hls',
                  manifestUrl: started.delivery.manifestUrl.replace(
                    `/api/playback/session/${started.sessionId}/`,
                    `/api/playback/session/${encodeURIComponent(here)}/`,
                  ),
                }
              : {
                  kind: 'direct',
                  url: started.delivery.url.replace(
                    `/api/playback/${linked.remoteId}/`,
                    `/api/playback/${mediaId}/`,
                  ),
                },
        },
      };
    },

    readSessionFile: async (sessionId, name) => {
      const linked = readLinkedName(sessionId);

      if (linked === null) {
        return local.readSessionFile(sessionId, name);
      }

      const answered = await asker.ask(
        linked.serverId,
        `/api/playback/session/${encodeURIComponent(linked.remoteId)}/${encodeURIComponent(name)}`,
      );

      return hasBody(answered) ? streamedOf(answered) : null;
    },

    readDirectFile: async (mediaId, range, renditionId) => {
      const linked = await linkedTitleOf(mediaId);

      if (linked === null) {
        return local.readDirectFile(mediaId, range, renditionId);
      }

      const headers = new Headers();

      if (range !== null) {
        headers.set('range', range);
      }

      const answered = await asker.ask(
        linked.serverId,
        `/api/playback/${linked.remoteId}/file${renditionId === null || renditionId === undefined ? '' : `?rendition=${encodeURIComponent(renditionId)}`}`,
        { headers },
      );

      return hasBody(answered) ? { ...streamedOf(answered), status: answered.status } : null;
    },

    trickplay: async (mediaId) => {
      const linked = await linkedTitleOf(mediaId);

      if (linked === null) {
        return local.trickplay(mediaId);
      }

      const answered = await asker.ask(
        linked.serverId,
        `/api/playback/${linked.remoteId}/trickplay`,
        { method: 'POST' },
      );
      const read =
        answered?.ok === true ? TrickplayResponse.safeParse(await answered.json()) : null;

      if (read?.success !== true) {
        return null;
      }

      const here = linkedNameOf(linked.serverId, read.data.id);

      return {
        ...read.data,
        id: here,
        url: read.data.url.replace(
          `/api/playback/trickplay/${read.data.id}/`,
          `/api/playback/trickplay/${encodeURIComponent(here)}/`,
        ),
      };
    },

    readFrame: async (mediaId, seconds, width) => {
      const linked = await linkedTitleOf(mediaId);

      if (linked === null) {
        return local.readFrame(mediaId, seconds, width);
      }

      const answered = await asker.ask(
        linked.serverId,
        `/api/playback/${linked.remoteId}/frame?seconds=${seconds.toString()}&width=${width.toString()}`,
      );

      return answered?.ok === true ? answered.arrayBuffer() : null;
    },

    readPreview: async (mediaId, range) => {
      const linked = await linkedTitleOf(mediaId);

      if (linked === null) {
        return local.readPreview(mediaId, range);
      }

      const headers = new Headers();

      if (range !== null) {
        headers.set('range', range);
      }

      const answered = await asker.ask(linked.serverId, `/api/media/${linked.remoteId}/preview`, {
        headers,
      });

      if (answered?.status === 202) {
        return { kind: 'pending' };
      }

      return hasBody(answered)
        ? { kind: 'ready', file: { ...streamedOf(answered), status: answered.status } }
        : { kind: 'absent' };
    },

    readTrickplayFile: async (trickplayId, name) => {
      const linked = readLinkedName(trickplayId);

      if (linked === null) {
        return local.readTrickplayFile(trickplayId, name);
      }

      const answered = await asker.ask(
        linked.serverId,
        `/api/playback/trickplay/${encodeURIComponent(linked.remoteId)}/${encodeURIComponent(name)}`,
      );

      return answered?.ok === true
        ? {
            body: await answered.arrayBuffer(),
            contentType: answered.headers.get('content-type') ?? 'application/octet-stream',
          }
        : null;
    },

    stop: async (sessionId, deviceId) => {
      const linked = readLinkedName(sessionId);

      if (linked === null) {
        return local.stop(sessionId, deviceId);
      }

      const answered = await asker.ask(
        linked.serverId,
        `/api/playback/session/${encodeURIComponent(linked.remoteId)}`,
        { method: 'DELETE' },
      );

      devices.delete(sessionId);

      return answered?.ok === true;
    },

    heartbeat: async (sessionId, isPlaying) => {
      const linked = readLinkedName(sessionId);

      if (linked === null) {
        return local.heartbeat(sessionId, isPlaying);
      }

      const answered = await asker.ask(
        linked.serverId,
        `/api/playback/session/${encodeURIComponent(linked.remoteId)}/heartbeat`,
        sendingJson({ isPlaying }),
      );
      const asked =
        answered?.status === 200 ? PeerAsksSchema.safeParse(await answered.json()) : null;
      const deviceId = devices.get(sessionId);

      if (asked?.success === true && deviceId !== undefined) {
        onAsked(deviceId, linked.serverId, asked.data.asks);

        return true;
      }

      return answered?.ok === true;
    },
  };
};

export type { LinkedTitle };

export { createLinkedPlayback };
