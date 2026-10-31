import { useEffect, useLayoutEffect, useRef } from 'react';
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
import { startPlaybackSession } from '@ValenceClient/playback/startPlaybackSession';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { thePhonesProfile } from '@ValenceMobile/playback/thePhonesProfile';
import type { AChromecast, AChromecastAsk } from './useChromecast.types';

const STREAM = 'application/x-mpegurl';

/**
 * Casts what is playing to a Chromecast or a Google TV, as the web does: once somebody picks one,
 * a session of its own is asked of the server for what such a device plays — with the subtitles
 * being read drawn into the picture, since a Chromecast is sent no words of its own — its address
 * is handed to the device with the title, the artwork and where they were, and the phone stops
 * playing it. While it casts, playing, pausing and moving through it are the device's; when the
 * cast ends, the phone takes it back from where the device had got to.
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
  const isCasting = state === CastState.CONNECTED && client !== null && !ask.isKept;
  const latest = useRef(ask);
  const lastAt = useRef<number | null>(null);
  const wasCasting = useRef(false);

  useLayoutEffect(() => {
    latest.current = ask;
  });

  useEffect(() => {
    if (position !== null) {
      lastAt.current = position;
    }
  }, [position]);

  useEffect(() => {
    if (!isCasting) {
      if (wasCasting.current) {
        wasCasting.current = false;
        latest.current.onGivenBack(lastAt.current ?? latest.current.startsAt());
      }

      return undefined;
    }

    let isOver = false;
    const now = latest.current;
    const from = now.startsAt();

    wasCasting.current = true;
    lastAt.current = from;

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

        return delivery.kind === 'direct'
          ? delivery.url
          : ((await castAddressOf(sessionId)) ?? delivery.manifestUrl);
      })
      .then(async (address) => {
        if (isOver) {
          return;
        }

        if (address === null) {
          now.onRefused();

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

        now.onTaken();
      })
      .catch(() => {
        if (!isOver) {
          now.onRefused();
        }
      });

    return () => {
      isOver = true;
    };
  }, [
    isCasting,
    client,
    device?.friendlyName,
    ask.mediaId,
    ask.burnInSubtitleId,
    ask.audioStreamIndex,
  ]);

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
