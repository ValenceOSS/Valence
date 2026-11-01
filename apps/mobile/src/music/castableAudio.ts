import type { AudioLike } from '@ValenceClient/music/createMusicPlayer';
import type { CastClient } from '@ValenceMobile/music/castAudio.types';
import type { CastableAudio } from './castableAudio.types';

/**
 * The phone's speaker, which a song can be moved off onto a Chromecast and back again without the
 * music player knowing: it hears whichever is playing and tells whichever it is to play.
 *
 * Moving carries the song over from the same moment, playing if it was, with the song lined up to
 * play after it, so the device runs on into it as the phone would have. Brought back, the song waits
 * on the phone, paused, rather than suddenly playing out loud from somebody's pocket, and the device
 * is left alone, since it has either gone or been sent something else to play.
 *
 * @param speaker - The phone's speaker.
 * @param castWith - Makes what plays on a device, given its media client.
 * @returns What the music player plays through.
 */
const castableAudio = (
  speaker: AudioLike,
  castWith: (client: CastClient) => AudioLike,
): CastableAudio => {
  const listeners = new Map<string, Set<() => void>>();
  const watchers = new Set<() => void>();
  let playing = speaker;
  let cast: AudioLike | null = null;
  let deviceName: string | null = null;
  let lined: { src: string; volume: number } | null = null;

  const tell = (type: string): void => {
    listeners.get(type)?.forEach((listener) => {
      listener();
    });
  };

  const hear = (from: AudioLike, type: string): void => {
    from.addEventListener(type, () => {
      if (playing === from) {
        tell(type);
      }
    });
  };

  const move = (to: AudioLike, isPlayingOn: boolean, isLeft: boolean): void => {
    const from = playing;
    const { src, currentTime, paused, volume, muted } = from;

    if (!isLeft) {
      from.pause();
    }

    playing = to;
    to.volume = volume;
    to.muted = muted;
    to.src = src;

    if (src !== '') {
      to.currentTime = currentTime;
    }

    if (lined !== null) {
      to.lineUp?.(lined.src, lined.volume);
    }

    if (src !== '' && !paused && isPlayingOn) {
      void to.play().catch(() => undefined);
    } else {
      tell('pause');
    }
  };

  const changed = (): void => {
    watchers.forEach((watcher) => {
      watcher();
    });
  };

  return {
    get src() {
      return playing.src;
    },
    set src(to: string) {
      playing.src = to;
    },
    get currentTime() {
      return playing.currentTime;
    },
    set currentTime(to: number) {
      playing.currentTime = to;
    },
    get duration() {
      return playing.duration;
    },
    get volume() {
      return playing.volume;
    },
    set volume(to: number) {
      playing.volume = to;
    },
    get muted() {
      return playing.muted;
    },
    set muted(to: boolean) {
      playing.muted = to;
    },
    get paused() {
      return playing.paused;
    },
    play: () => playing.play(),
    pause: () => {
      playing.pause();
    },
    lineUp: (src, volume) => {
      lined = { src, volume };
      playing.lineUp?.(src, volume);
    },
    crossfade: (seconds) => {
      speaker.crossfade?.(seconds);
    },
    addEventListener: (type, listener) => {
      const held = listeners.get(type);

      if (held === undefined) {
        listeners.set(type, new Set([listener]));
        hear(speaker, type);

        if (cast !== null) {
          hear(cast, type);
        }

        return;
      }

      held.add(listener);
    },
    castTo: (client, name) => {
      const was = cast;
      const next = castWith(client);

      for (const type of listeners.keys()) {
        hear(next, type);
      }

      cast = next;
      deviceName = name;
      move(next, true, false);
      was?.release?.();
      changed();
    },
    bringBack: () => {
      const was = cast;

      if (was === null) {
        return;
      }

      move(speaker, false, true);
      was.release?.();
      cast = null;
      deviceName = null;
      changed();
    },
    castingTo: () => deviceName,
    subscribe: (watcher) => {
      watchers.add(watcher);

      return () => {
        watchers.delete(watcher);
      };
    },
    release: () => {
      speaker.release?.();
      cast?.release?.();
      listeners.clear();
      watchers.clear();
    },
  };
};

export { castableAudio };
