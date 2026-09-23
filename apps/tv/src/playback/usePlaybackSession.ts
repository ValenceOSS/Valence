import { useEffect, useRef, useState } from 'react';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import {
  heartbeatPlaybackSession,
  sendPresenceHeartbeat,
  startPlaybackSession,
  stopPlaybackSession,
  stopWatching,
} from '@ValenceClient/playback/startPlaybackSession';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeaders } from '@ValenceTv/platform/theSessionToken';
import { theTvsProfile } from '@ValenceTv/playback/theTvsProfile';
import type { QualityPreference } from '@ValenceClient/playback/qualityPreference';
import type { StartedSession } from '@ValenceClient/playback/startPlaybackSession';

type Session =
  | { kind: 'starting' }
  | { kind: 'failed'; reason: string }
  | {
      kind: 'ready';
      source: { uri: string; headers: Record<string, string>; contentType: 'hls' | 'auto' };
      started: StartedSession;
    };

const SESSION_HEARTBEAT_MS = 30_000;

const PRESENCE_HEARTBEAT_MS = 15_000;

/**
 * Asks the server to play a title on this television, and keeps the session it opens alive for as
 * long as the player is on screen.
 *
 * The server decides from the television's profile whether to send the file as it is or convert it
 * as it goes; either way what comes back is an address the player opens as whoever is signed in. A
 * session converting on the fly is told the player is still there, since a conversion nobody is
 * watching is stopped to spare the server, and the household's activity is told what is on. Leaving
 * ends both, so the server is not left converting for an empty room.
 *
 * @param mediaId - What to play.
 * @param startSeconds - Where to start, which the server starts converting from; it is sent to the
 *   whole second, since the server refuses anything finer.
 * @param isPlaying - Whether the player is playing right now, asked at each heartbeat.
 * @param audioStreamIndex - Which of the file's sound tracks to send, where somebody has chosen one;
 *   choosing another starts a new session, since the server converts the sound it was told to.
 * @param requestedQuality - The most it should be sent at, or the original where nothing is asked.
 * @returns Whether the session is starting, failed and why, or ready with what the player opens.
 */
const usePlaybackSession = (
  mediaId: string,
  startSeconds: number,
  isPlaying: () => boolean,
  audioStreamIndex?: number,
  requestedQuality?: QualityPreference,
): Session => {
  const [session, setSession] = useState<Session>({ kind: 'starting' });
  const asking = useRef(isPlaying);

  useEffect(() => {
    asking.current = isPlaying;
  });

  useEffect(() => {
    const clientId = platformInUse().thisClientId();
    let isAbandoned = false;
    let sessionId: string | null = null;
    const timers: ReturnType<typeof setInterval>[] = [];

    setSession({ kind: 'starting' });

    void startPlaybackSession(
      mediaId,
      theTvsProfile(),
      clientId,
      Math.floor(startSeconds),
      audioStreamIndex,
      requestedQuality,
    ).then((outcome) => {
      if (outcome.kind === 'failed') {
        if (!isAbandoned) {
          setSession({ kind: 'failed', reason: outcome.reason });
        }

        return;
      }

      const started = outcome.session.sessionId;

      sessionId = started;

      if (isAbandoned) {
        void stopPlaybackSession(started, clientId);

        return;
      }

      const { delivery } = outcome.session;

      if (delivery.kind === 'hls') {
        timers.push(
          setInterval(() => {
            void heartbeatPlaybackSession(started, asking.current(), clientId);
          }, SESSION_HEARTBEAT_MS),
        );
      }

      timers.push(
        setInterval(() => {
          void sendPresenceHeartbeat(clientId, asking.current());
        }, PRESENCE_HEARTBEAT_MS),
      );

      const uri = onTheServer(delivery.kind === 'hls' ? delivery.manifestUrl : delivery.url);

      setSession({
        kind: 'ready',
        source: {
          uri,
          headers: signedHeaders(),
          contentType: delivery.kind === 'hls' ? 'hls' : 'auto',
        },
        started: outcome.session,
      });
    });

    return () => {
      isAbandoned = true;

      for (const timer of timers) {
        clearInterval(timer);
      }

      if (sessionId !== null) {
        void stopPlaybackSession(sessionId, clientId);
      }

      void stopWatching(clientId);
    };
  }, [mediaId, startSeconds, audioStreamIndex, requestedQuality]);

  return session;
};

export type { Session };

export { usePlaybackSession };
