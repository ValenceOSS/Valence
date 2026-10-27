import { useEffect, useRef, useState } from 'react';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { holdWatching } from '@ValenceClient/playback/holdWatching';
import { theReadiedEpisode } from '@ValenceClient/playback/theReadiedEpisode';
import { beginReadiedSession } from '@ValenceClient/playback/beginReadiedSession';
import {
  heartbeatPlaybackSession,
  sendPresenceHeartbeat,
  startPlaybackSession,
  stopPlaybackSession,
} from '@ValenceClient/playback/startPlaybackSession';
import { onTheServer } from '@ValenceTv/platform/theServersOrigin';
import { signedHeaders } from '@ValenceTv/platform/theSessionToken';
import { theTvsProfile } from '@ValenceTv/playback/theTvsProfile';
import type { Converted } from '@ValenceContracts/schemas/Converted';
import type { QualityPreference } from '@ValenceClient/playback/qualityPreference';
import type { StartedSession } from '@ValenceClient/playback/startPlaybackSession';
import type { PlaybackProblem } from '@ValenceContracts/schemas/PlaybackProblem';

type Session =
  | { kind: 'starting' }
  | { kind: 'failed'; reason: string; problem: PlaybackProblem }
  | { kind: 'lost' }
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
 * @param converted - What to have converted rather than copied, after a copy of it failed to play.
 * @param attempt - How many times it has been asked for again, after the server was lost; a new
 *   number asks again.
 * @returns Whether the session is starting, failed and why, lost because the server forgot it, or
 *   ready with what the player opens.
 */
const usePlaybackSession = (
  mediaId: string,
  startSeconds: number,
  isPlaying: () => boolean,
  audioStreamIndex?: number,
  requestedQuality?: QualityPreference,
  converted?: Converted,
  attempt = 0,
): Session => {
  const [session, setSession] = useState<Session>({ kind: 'starting' });
  const asking = useRef(isPlaying);

  useEffect(() => {
    asking.current = isPlaying;
  });

  useEffect(() => {
    const clientId = platformInUse().thisClientId();
    const letGo = holdWatching(clientId);
    let isAbandoned = false;
    let sessionId: string | null = null;
    const timers: ReturnType<typeof setInterval>[] = [];

    setSession({ kind: 'starting' });

    const readied =
      converted === undefined
        ? theReadiedEpisode().take({
            mediaId,
            startSeconds: Math.floor(startSeconds),
            audioStreamIndex,
            subtitleStreamIndex: undefined,
            quality: requestedQuality,
          })
        : null;

    if (readied !== null) {
      void beginReadiedSession(readied.sessionId, clientId);
    }

    void (
      readied === null
        ? startPlaybackSession(
            mediaId,
            theTvsProfile(),
            clientId,
            Math.floor(startSeconds),
            audioStreamIndex,
            requestedQuality,
            undefined,
            converted,
          )
        : Promise.resolve({ kind: 'started' as const, session: readied })
    ).then((outcome) => {
      if (outcome.kind === 'failed') {
        if (!isAbandoned) {
          setSession({ kind: 'failed', reason: outcome.reason, problem: outcome.problem });
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
            void heartbeatPlaybackSession(started, asking.current(), clientId).then((answer) => {
              if (answer === 'gone' && !isAbandoned) {
                setSession({ kind: 'lost' });
              }
            });
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

      letGo();
    };
  }, [mediaId, startSeconds, audioStreamIndex, requestedQuality, converted, attempt]);

  return session;
};

export type { Session };

export { usePlaybackSession };
