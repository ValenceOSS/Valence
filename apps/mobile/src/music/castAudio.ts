import { MediaPlayerIdleReason, MediaPlayerState } from 'react-native-google-cast';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { castTrackAddressOf } from '@ValenceClient/music/castTrackAddressOf';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { whichTrackIsAt } from '@ValenceMobile/music/whichTrackIsAt';
import type { MediaInfo, MediaStatus } from 'react-native-google-cast';
import type { AudioLike } from '@ValenceClient/music/createMusicPlayer';
import type { CastAudioOptions, CastClient } from './castAudio.types';

/**
 * A Chromecast, dressed as the audio element the music player was written against, so the queue,
 * the reporting and everything the phone's own speaker does is done on the device by the same code.
 *
 * Each track is sent from an address of its own the server hands out with a ticket, since the
 * device has no session to stream it with, together with its title, artists and album's cover to
 * show on the television. The track the player is lined up to play next is put in the device's queue
 * behind the one playing, so it runs on into it by itself even while the phone is asleep, and says it
 * has advanced when it does. What the device says about any other track — one it was playing before
 * it was handed this one, arriving late — is not taken as it moving on.
 *
 * The device can be taken over by something else — a film sent to it from the player — and then it
 * says it is lost, so the music can come back to the phone rather than its buttons press on a film.
 *
 * @param client - The device's media client.
 * @param options - How to describe a track, what to do when the device is lost, and how often to ask
 *   it where it has got to.
 * @returns What the music player plays through.
 */
const castAudio = (
  client: CastClient,
  { describe, onLost, everyMs = 1000 }: CastAudioOptions,
): AudioLike => {
  const listeners = new Map<string, Set<() => void>>();
  const ours = new Set<string>();
  const queued = new Set<string>();
  let source = '';
  let at = 0;
  let long = Number.NaN;
  let isPaused = true;
  let loudness = 1;
  let isMuted = false;
  let startAt = 0;
  let isLoaded = false;
  let lastState: MediaPlayerState | null = null;
  let handedOver: Promise<void> = Promise.resolve();
  let asked = 0;
  let upNext = '';
  let linedUp = 0;

  const tell = (type: string): void => {
    listeners.get(type)?.forEach((listener) => {
      listener();
    });
  };

  const sent = async (src: string): Promise<MediaInfo | null> => {
    const which = whichTrackIsAt(src);
    const address = which === null ? null : await castTrackAddressOf(which.trackId, which.quality);

    if (which === null || address === null) {
      return null;
    }

    const track = describe(which.trackId);

    return {
      contentId: src,
      contentUrl: onThisServer(address),
      metadata: {
        type: 'musicTrack',
        ...(track === null
          ? {}
          : {
              title: track.title,
              artist: track.artists.map((artist) => artist.name).join(', '),
              albumTitle: track.album.title,
              images: track.album.hasArtwork
                ? [{ url: onThisServer(albumArtworkUrl(track.album.id)) }]
                : [],
            }),
      },
    };
  };

  const heard = (status: MediaStatus | null): void => {
    const playing = status?.mediaInfo?.contentId ?? null;

    if (status === null || playing === null) {
      return;
    }

    if (!ours.has(playing)) {
      if (source !== '') {
        onLost();
      }

      return;
    }

    if (playing !== source && playing !== upNext && !queued.has(playing)) {
      return;
    }

    if (playing !== source) {
      queued.delete(playing);
      source = playing;
      upNext = '';
      long = Number.NaN;
      isLoaded = false;
      tell('advanced');
    }

    at = status.streamPosition;

    const lasts = status.mediaInfo?.streamDuration ?? 0;

    if (!isLoaded && lasts > 0) {
      long = lasts;
      isLoaded = true;
      tell('loadedmetadata');
    }

    if (status.playerState !== lastState) {
      lastState = status.playerState;

      switch (status.playerState) {
        case MediaPlayerState.PLAYING:
          isPaused = false;
          tell('canplay');
          tell('playing');
          break;
        case MediaPlayerState.PAUSED:
          isPaused = true;
          tell('pause');
          break;
        case MediaPlayerState.BUFFERING:
        case MediaPlayerState.LOADING:
          tell('waiting');
          break;
        case MediaPlayerState.IDLE:
          if (status.idleReason === MediaPlayerIdleReason.FINISHED) {
            isPaused = true;
            tell('ended');
          } else if (status.idleReason === MediaPlayerIdleReason.ERROR) {
            tell('error');
          }
          break;
        case null:
          break;
      }
    }

    tell('timeupdate');
  };

  const hearing = client.onMediaStatusUpdated(heard);

  const following = setInterval(() => {
    if (isPaused || !isLoaded) {
      return;
    }

    void client
      .getStreamPosition()
      .then((position) => {
        if (position !== null) {
          at = position;
          tell('timeupdate');
        }
      })
      .catch(() => undefined);
  }, everyMs);

  return {
    get src() {
      return source;
    },
    set src(to: string) {
      source = to;
      upNext = '';
      at = 0;
      startAt = 0;
      long = Number.NaN;
      isLoaded = false;
      lastState = null;
      asked += 1;

      const thisAsk = asked;

      if (to === '') {
        isPaused = true;
        handedOver = Promise.resolve();
        void client.stop().catch(() => undefined);

        return;
      }

      ours.add(to);
      queued.clear();
      handedOver = sent(to)
        .catch(() => null)
        .then(async (mediaInfo) => {
          if (thisAsk !== asked) {
            return;
          }

          if (mediaInfo === null) {
            tell('error');

            return;
          }

          await client
            .loadMedia({ mediaInfo, autoplay: !isPaused, startTime: startAt })
            .catch(() => {
              tell('error');
            });
        });
    },
    get currentTime() {
      return at;
    },
    set currentTime(to: number) {
      at = to;

      if (!isLoaded) {
        startAt = to;

        return;
      }

      void client.seek({ position: to }).catch(() => undefined);
    },
    get duration() {
      return long;
    },
    get volume() {
      return loudness;
    },
    set volume(to: number) {
      loudness = to;
    },
    get muted() {
      return isMuted;
    },
    set muted(to: boolean) {
      isMuted = to;
      void handedOver.then(() => client.setStreamMuted(to)).catch(() => undefined);
    },
    get paused() {
      return isPaused;
    },
    play: async () => {
      isPaused = false;
      await handedOver;
      await client.play().catch(() => undefined);
    },
    pause: () => {
      isPaused = true;
      void handedOver.then(() => client.pause()).catch(() => undefined);
    },
    lineUp: (to) => {
      if (to === upNext) {
        return;
      }

      upNext = to;
      linedUp += 1;

      const thisAsk = asked;
      const thisLine = linedUp;

      if (to === '') {
        return;
      }

      ours.add(to);
      void handedOver
        .then(async () => sent(to))
        .then(async (mediaInfo) => {
          if (mediaInfo !== null && thisAsk === asked && thisLine === linedUp) {
            queued.add(to);
            await client.queueInsertItem({ mediaInfo, autoplay: true, preloadTime: 20 });
          }
        })
        .catch(() => undefined);
    },
    addEventListener: (type, listener) => {
      const held = listeners.get(type) ?? new Set<() => void>();

      held.add(listener);
      listeners.set(type, held);
    },
    release: () => {
      hearing.remove();
      clearInterval(following);
      listeners.clear();
    },
  };
};

export { castAudio };
