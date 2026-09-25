import type { StartedSession } from '@ValenceClient/playback/startPlaybackSession';

const AS_IT_IS = { code: 'ClientSupportsSource', detail: 'Kept on this device.' } as const;

/**
 * A session for a file already on this device, so the ordinary player can play it without asking
 * the server for anything: every download is prepared as a file every client plays as it stands.
 *
 * @param mediaId - What it is a copy of.
 * @param url - Where the player reads it from on this device.
 * @returns A session that plays the file directly.
 */
const aKeptSession = (mediaId: string, url: string): StartedSession => ({
  sessionId: `kept-${mediaId}`,
  delivery: { kind: 'direct', url },
  mode: 'direct',
  plan: {
    mediaId,
    container: { kind: 'passthrough', reason: AS_IT_IS },
    video: { kind: 'passthrough', reason: AS_IT_IS },
    audio: { kind: 'passthrough', streamIndex: null, reason: AS_IT_IS },
    subtitles: { kind: 'none', reason: AS_IT_IS },
  },
  warnings: [],
  reuse: null,
});

export { aKeptSession };
