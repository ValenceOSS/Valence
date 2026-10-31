import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import GoogleCast, {
  CastState,
  MediaPlayerState,
  useCastDevice,
  useCastState,
  useMediaStatus,
  useRemoteMediaClient,
  useStreamPosition,
} from 'react-native-google-cast';
import { castAddressOf } from '@ValenceClient/playback/castAddressOf';
import { castDeviceProfile } from '@ValenceClient/playback/castDeviceProfile';
import {
  heartbeatPlaybackSession,
  startPlaybackSession,
  stopPlaybackSession,
} from '@ValenceClient/playback/startPlaybackSession';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { thePhonesProfile } from '@ValenceMobile/playback/thePhonesProfile';
import type { AChromecast, AChromecastAsk } from './useChromecast.types';

const STREAM = 'application/x-mpegurl';

const SAY_IT_IS_ALIVE_EVERY = 30_000;

/**
 * Casts what is playing to a Chromecast or a Google TV, as the web does: once somebody picks one,
 * a session of its own is asked of the server for what such a device plays — with the subtitles
 * being read drawn into the picture, since a Chromecast is sent no words of its own — its address
 * is handed to the device with the title, the artwork and where they were, and the phone stops
 * playing it. It is casting only once the device has taken it: a device that refuses, or a session
 * the server would not start, leaves the phone playing and ends the cast rather than leaving the
 * controls pointed at a device with nothing on it. While it casts, playing, pausing and moving
 * through it are the device's, and the device's session is kept alive on the server as the phone's
 * own is; asking again for another sound or other words starts the device from where it had got to.
 * When the cast ends the device's session is let go, and the phone takes it back from there.
 *
 * A film kept on the phone is not cast, since the device cannot reach the phone's own copy, and
 * casting is only offered while there is a Chromecast on the network to cast to, so the player
 * does not show a second way to send it somewhere beside AirPlay when there is nowhere for it to
 * go.
 *
 * @param ask - What is playing and how, and what to tell as the cast starts, ends or is refused.
 * @returns Whether it is casting and to what, how far in, and the device's own controls.
 */
const useChromecast = (ask: AChromecastAsk): AChromecast => {
  const state = useCastState();
  const device = useCastDevice();
  const client = useRemoteMediaClient();
  const status = useMediaStatus();
  const position = useStreamPosition(1);
  const isConnected = state === CastState.CONNECTED && client !== null && !ask.isKept;
  const [isTaken, setIsTaken] = useState(false);
  const isCasting = isConnected && isTaken;
  const latest = useRef(ask);
  const lastAt = useRef<number | null>(null);
  const wasCasting = useRef(false);
  const castMedia = useRef<string | null>(null);
  const castSession = useRef<string | null>(null);
  const isPlayingThere = useRef(false);

  useLayoutEffect(() => {
    latest.current = ask;
    isPlayingThere.current = status?.playerState === MediaPlayerState.PLAYING;
  });

  useEffect(() => {
    if (position !== null) {
      lastAt.current = position;
    }
  }, [position]);

  useEffect(() => {
    if (!isConnected) {
      setIsTaken(false);

      if (wasCasting.current) {
        wasCasting.current = false;
        latest.current.onGivenBack(lastAt.current ?? latest.current.startsAt());
      }

      return undefined;
    }

    let isOver = false;
    const hasEnded = (): boolean => isOver;
    let started: string | null = null;
    const now = latest.current;
    const from =
      wasCasting.current && castMedia.current === now.mediaId
        ? (lastAt.current ?? now.startsAt())
        : now.startsAt();

    lastAt.current = from;

    const refuse = () => {
      setIsTaken(false);

      if (started !== null) {
        void stopPlaybackSession(started, now.clientId);
        started = null;
      }

      now.onRefused();
      void GoogleCast.getSessionManager()
        .endCurrentSession(true)
        .catch(() => undefined);
    };

    void startPlaybackSession(
      now.mediaId,
      castDeviceProfile(device?.friendlyName ?? thePhonesProfile().name),
      now.clientId,
      Math.floor(from),
      now.audioStreamIndex,
      now.quality,
      undefined,
      undefined,
      now.burnInSubtitleId,
      true,
    )
      .then(async (outcome) => {
        if (outcome.kind !== 'started') {
          return null;
        }

        const { delivery, sessionId } = outcome.session;

        if (hasEnded()) {
          void stopPlaybackSession(sessionId, now.clientId);

          return null;
        }

        started = sessionId;

        return delivery.kind === 'direct'
          ? delivery.url
          : ((await castAddressOf(sessionId)) ?? delivery.manifestUrl);
      })
      .then(async (address) => {
        if (hasEnded()) {
          return;
        }

        if (address === null) {
          refuse();

          return;
        }

        await client.loadMedia({
          autoplay: true,
          startTime: from,
          mediaInfo: {
            contentUrl: onThisServer(address),
            contentType: STREAM,
            metadata: {
              type: 'movie',
              title: now.title,
              ...(now.artwork === null ? {} : { images: [{ url: now.artwork }] }),
            },
          },
        });

        if (hasEnded()) {
          return;
        }

        castSession.current = started;
        wasCasting.current = true;
        castMedia.current = now.mediaId;
        setIsTaken(true);
        now.onTaken();
      })
      .catch(() => {
        if (!hasEnded()) {
          refuse();
        }
      });

    return () => {
      isOver = true;

      if (started !== null) {
        void stopPlaybackSession(started, now.clientId);
      }

      castSession.current = null;
    };
  }, [
    isConnected,
    client,
    device?.friendlyName,
    ask.mediaId,
    ask.burnInSubtitleId,
    ask.audioStreamIndex,
  ]);

  useEffect(() => {
    if (!isCasting) {
      return undefined;
    }

    const beat = setInterval(() => {
      const sessionId = castSession.current;

      if (sessionId !== null) {
        void heartbeatPlaybackSession(sessionId, isPlayingThere.current, latest.current.clientId);
      }
    }, SAY_IT_IS_ALIVE_EVERY);

    return () => {
      clearInterval(beat);
    };
  }, [isCasting]);

  return {
    isCasting,
    isOffered:
      !ask.isKept &&
      state !== null &&
      state !== undefined &&
      state !== CastState.NO_DEVICES_AVAILABLE,
    deviceName: isCasting ? (device?.friendlyName ?? null) : null,
    isPlaying: status?.playerState === MediaPlayerState.PLAYING,
    at: isCasting ? position : null,
    choose: () => {
      void GoogleCast.showCastDialog();
    },
    playOrPause: () => {
      if (client === null) {
        return;
      }

      void (status?.playerState === MediaPlayerState.PLAYING ? client.pause() : client.play());
    },
    seekTo: (seconds) => {
      void client?.seek({ position: Math.max(0, seconds) });
    },
  };
};

export { useChromecast };
