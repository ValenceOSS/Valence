import type { StartedSession } from '@ValenceClient/playback/startPlaybackSession';
import { say } from '@ValenceI18n/say';

/**
 * A session for a file already on this device, so the ordinary player can play it without asking
 * the server for anything: every download is prepared as a file every client plays as it stands.
 *
 * @param mediaId - What it is a copy of.
 * @param url - Where the player reads it from on this device.
 * @returns A session that plays the file directly.
 */
const aKeptSession = (mediaId: string, url: string): StartedSession => {
  const asItIs = { code: 'ClientSupportsSource', detail: say('client.aKeptSession.kept') } as const;

  return {
    sessionId: `kept-${mediaId}`,
    delivery: { kind: 'direct', url },
    mode: 'direct',
    plan: {
      mediaId,
      container: { kind: 'passthrough', reason: asItIs },
      video: { kind: 'passthrough', reason: asItIs },
      audio: { kind: 'passthrough', streamIndex: null, reason: asItIs },
      subtitles: { kind: 'none', reason: asItIs },
    },
    warnings: [],
    reuse: null,
  };
};

export { aKeptSession };
