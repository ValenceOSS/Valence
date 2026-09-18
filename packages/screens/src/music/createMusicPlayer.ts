import {
  addToQueue,
  currentOf,
  cycleRepeat,
  jumpTo,
  nextIn,
  playNext,
  previousIn,
  removeFromQueue,
  startQueue,
  toggleShuffle,
} from '@ValenceClient/music/playQueue';
import { playableQuality } from '@ValenceClient/music/playableQuality';
import type { PlayQueue, QueueSource } from '@ValenceClient/music/playQueue';
import type { MusicPreferences } from '@ValenceClient/music/musicPreferences';
import type { AudioQuality, MusicTrack } from '@ValenceContracts/schemas/Music';
import type { MusicCommand, MusicNowPlaying } from '@ValenceContracts/schemas/MusicRemote';

type AudioLike = {
  src: string;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  paused: boolean;
  play: () => Promise<void>;
  pause: () => void;
  addEventListener: (type: string, listener: () => void) => void;
};

type RemoteDevice = { clientId: string; label: string };

type MusicPlayerState = {
  queue: PlayQueue | null;
  current: MusicTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  positionSeconds: number;
  durationSeconds: number;
  volume: number;
  isMuted: boolean;
  quality: AudioQuality;
  playingQuality: AudioQuality | null;
  problem: string | null;
  remote: RemoteDevice | null;
};

type PlayOptions = {
  isOrdered?: boolean;
  isShuffled?: boolean;
  source?: QueueSource | null;
  positionSeconds?: number;
  isPlaying?: boolean;
};

type MusicPlayerDeps = {
  audio: AudioLike;
  streamUrl: (trackId: string, quality: AudioQuality) => string;
  canPlay: (type: string) => boolean;
  fetchTracks: (ids: readonly string[]) => Promise<MusicTrack[]>;
  report: (nowPlaying: MusicNowPlaying | null) => void;
  command: (clientId: string, command: MusicCommand) => Promise<boolean>;
  preferences: {
    read: () => MusicPreferences;
    save: (change: Partial<MusicPreferences>) => void;
  };
  now: () => number;
  random?: () => number;
  reportEveryMs?: number;
};

type MusicPlayer = {
  read: () => MusicPlayerState;
  subscribe: (listener: () => void) => () => void;
  play: (tracks: readonly MusicTrack[], startAt: number, options?: PlayOptions) => void;
  toggle: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  playNext: (tracks: readonly MusicTrack[]) => void;
  addToQueue: (tracks: readonly MusicTrack[]) => void;
  jumpTo: (at: number) => void;
  removeFromQueue: (at: number) => void;
  setQuality: (quality: AudioQuality) => void;
  stop: () => void;
  playOn: (device: RemoteDevice) => void;
  playHere: (positionSeconds: number, isPlaying: boolean) => void;
  obey: (command: MusicCommand) => void;
};

const RESTART_AFTER_SECONDS = 3;

const REPORT_EVERY_MS = 15_000;

const COULD_NOT_PLAY = 'That track would not play.';

/**
 * The one music player a window has: a queue, an audio element, and the device it may be
 * controlling instead of itself.
 *
 * It lives outside any screen, so music carries on across every page — through browsing, the
 * account dialog, the admin area. Everything it touches is handed to it rather than reached for,
 * which is what lets it be driven in a test with an audio element that is not one.
 *
 * Lossless is the file as it is, and a device that cannot play a file is asked for the highest
 * encode instead; one that fails partway is asked again at that encode, where it left off, before
 * anybody is told it would not play. What it plays is reported to the server, so this person's
 * other devices can show it, and while it is controlling one of them every button goes there
 * instead.
 *
 * @param deps - The audio element, where tracks stream from, and how to reach the server.
 * @returns The player.
 */
const createMusicPlayer = (deps: MusicPlayerDeps): MusicPlayer => {
  const { audio, streamUrl, canPlay, fetchTracks, report, command, preferences, now } = deps;
  const random = deps.random ?? Math.random;
  const reportEveryMs = deps.reportEveryMs ?? REPORT_EVERY_MS;
  const listeners = new Set<() => void>();
  const kept = preferences.read();

  let state: MusicPlayerState = {
    queue: null,
    current: null,
    isPlaying: false,
    isLoading: false,
    positionSeconds: 0,
    durationSeconds: 0,
    volume: kept.volume,
    isMuted: kept.isMuted,
    quality: kept.quality,
    playingQuality: null,
    problem: null,
    remote: null,
  };

  let lastReportMs = Number.NEGATIVE_INFINITY;
  let resumeAt: number | null = null;

  audio.volume = kept.volume;
  audio.muted = kept.isMuted;

  const change = (next: Partial<MusicPlayerState>): void => {
    state = { ...state, ...next };

    for (const listener of listeners) {
      listener();
    }
  };

  const tell = (isForced: boolean): void => {
    const at = now();

    if (!isForced && at - lastReportMs < reportEveryMs) {
      return;
    }

    lastReportMs = at;

    const { current } = state;

    report(
      current === null || state.remote !== null
        ? null
        : {
            trackId: current.id,
            title: current.title,
            artists: current.artists.map((artist) => artist.name),
            albumId: current.album.id,
            hasArtwork: current.album.hasArtwork,
            positionSeconds: Math.max(0, state.positionSeconds),
            durationSeconds: Math.max(0, state.durationSeconds || current.durationSeconds),
            isPlaying: state.isPlaying,
            volume: state.volume,
            reportedAtMs: Math.max(0, Math.round(at)),
          },
    );
  };

  const load = (queue: PlayQueue, positionSeconds: number, shouldPlay: boolean): void => {
    const track = currentOf(queue);

    if (track === null) {
      return;
    }

    const quality = playableQuality(track, state.quality, canPlay);

    resumeAt = positionSeconds > 0 ? positionSeconds : null;
    audio.src = streamUrl(track.id, quality);

    change({
      queue,
      current: track,
      playingQuality: quality,
      positionSeconds,
      durationSeconds: track.durationSeconds,
      isLoading: true,
      problem: null,
    });

    if (shouldPlay) {
      audio.play().catch(() => {
        change({ isPlaying: false, isLoading: false });
      });
    }

    tell(true);
  };

  const remotely = (sent: MusicCommand): boolean => {
    if (state.remote === null) {
      return false;
    }

    void command(state.remote.clientId, sent);

    return true;
  };

  audio.addEventListener('loadedmetadata', () => {
    if (resumeAt !== null) {
      audio.currentTime = resumeAt;
      resumeAt = null;
    }

    change({
      durationSeconds: Number.isFinite(audio.duration) ? audio.duration : state.durationSeconds,
    });
  });

  audio.addEventListener('timeupdate', () => {
    change({ positionSeconds: audio.currentTime });

    if (state.isPlaying) {
      tell(false);
    }
  });

  audio.addEventListener('playing', () => {
    change({ isPlaying: true, isLoading: false });
    tell(true);
  });

  audio.addEventListener('pause', () => {
    change({ isPlaying: false });
    tell(true);
  });

  audio.addEventListener('waiting', () => {
    change({ isLoading: true });
  });

  audio.addEventListener('canplay', () => {
    change({ isLoading: false });
  });

  audio.addEventListener('seeked', () => {
    tell(true);
  });

  audio.addEventListener('ended', () => {
    const { queue } = state;
    const moved = queue === null ? null : nextIn(queue, false);

    if (moved === null) {
      change({ isPlaying: false, positionSeconds: 0 });
      tell(true);

      return;
    }

    load(moved, 0, true);
  });

  audio.addEventListener('error', () => {
    const { queue, playingQuality } = state;

    if (queue !== null && playingQuality === 'lossless') {
      const quality = 'high';
      const track = currentOf(queue);

      if (track !== null) {
        resumeAt = state.positionSeconds > 0 ? state.positionSeconds : null;
        audio.src = streamUrl(track.id, quality);
        change({ playingQuality: quality });
        audio.play().catch(() => {
          change({ isPlaying: false });
        });

        return;
      }
    }

    change({ isPlaying: false, isLoading: false, problem: COULD_NOT_PLAY });
  });

  const player: MusicPlayer = {
    read: () => state,

    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },

    play: (tracks, startAt, options = {}) => {
      if (tracks.length === 0) {
        return;
      }

      const queue = startQueue(tracks, startAt, {
        ...(options.isOrdered === undefined ? {} : { isOrdered: options.isOrdered }),
        ...(options.isShuffled === undefined ? {} : { isShuffled: options.isShuffled }),
        repeat: state.queue?.repeat ?? 'off',
        source: options.source ?? null,
        random,
      });

      if (state.remote !== null) {
        const played = queue.order.flatMap((index) => {
          const track = queue.tracks[index];

          return track === undefined ? [] : [track.id];
        });

        void command(state.remote.clientId, {
          kind: 'play',
          trackIds: played,
          index: 0,
          positionSeconds: options.positionSeconds ?? 0,
          isPlaying: options.isPlaying ?? true,
        });
        change({ queue, current: currentOf(queue) });

        return;
      }

      load(queue, options.positionSeconds ?? 0, options.isPlaying ?? true);
    },

    toggle: () => {
      if (state.isPlaying) {
        player.pause();
      } else {
        player.resume();
      }
    },

    pause: () => {
      if (remotely({ kind: 'pause' })) {
        return;
      }

      audio.pause();
    },

    resume: () => {
      if (remotely({ kind: 'resume' })) {
        return;
      }

      if (state.current === null) {
        return;
      }

      audio.play().catch(() => {
        change({ isPlaying: false });
      });
    },

    next: () => {
      if (remotely({ kind: 'next' })) {
        return;
      }

      const moved = state.queue === null ? null : nextIn(state.queue, true);

      if (moved !== null) {
        load(moved, 0, true);
      }
    },

    previous: () => {
      if (remotely({ kind: 'previous' })) {
        return;
      }

      if (state.queue === null) {
        return;
      }

      if (audio.currentTime > RESTART_AFTER_SECONDS) {
        audio.currentTime = 0;
        change({ positionSeconds: 0 });

        return;
      }

      load(previousIn(state.queue), 0, true);
    },

    seek: (seconds) => {
      const at = Math.max(0, seconds);

      if (remotely({ kind: 'seek', positionSeconds: at })) {
        return;
      }

      audio.currentTime = at;
      change({ positionSeconds: at });
    },

    setVolume: (volume) => {
      const level = Math.min(1, Math.max(0, volume));

      if (remotely({ kind: 'volume', volume: level })) {
        return;
      }

      audio.volume = level;
      audio.muted = false;
      preferences.save({ volume: level, isMuted: false });
      change({ volume: level, isMuted: false });
    },

    toggleMute: () => {
      const isMuted = !state.isMuted;

      audio.muted = isMuted;
      preferences.save({ isMuted });
      change({ isMuted });
    },

    toggleShuffle: () => {
      if (state.queue !== null) {
        change({ queue: toggleShuffle(state.queue, random) });
      }
    },

    cycleRepeat: () => {
      if (state.queue !== null) {
        change({ queue: cycleRepeat(state.queue) });
      }
    },

    playNext: (tracks) => {
      if (state.queue === null) {
        player.play(tracks, 0);

        return;
      }

      change({ queue: playNext(state.queue, tracks) });
    },

    addToQueue: (tracks) => {
      if (state.queue === null) {
        player.play(tracks, 0);

        return;
      }

      change({ queue: addToQueue(state.queue, tracks) });
    },

    jumpTo: (at) => {
      if (state.queue !== null) {
        load(jumpTo(state.queue, at), 0, true);
      }
    },

    removeFromQueue: (at) => {
      if (state.queue !== null) {
        change({ queue: removeFromQueue(state.queue, at) });
      }
    },

    setQuality: (quality) => {
      preferences.save({ quality });
      change({ quality });

      if (state.queue !== null && state.remote === null) {
        load(state.queue, audio.currentTime, state.isPlaying);
      }
    },

    stop: () => {
      if (remotely({ kind: 'stop' })) {
        return;
      }

      audio.pause();
      change({ queue: null, current: null, isPlaying: false, positionSeconds: 0 });
      tell(true);
    },

    playOn: (device) => {
      const { queue } = state;
      const position = audio.currentTime;

      if (queue !== null) {
        const played = queue.order.slice(queue.at).flatMap((index) => {
          const track = queue.tracks[index];

          return track === undefined ? [] : [track.id];
        });

        void command(device.clientId, {
          kind: 'play',
          trackIds: played,
          index: 0,
          positionSeconds: position,
          isPlaying: true,
        });
      }

      audio.pause();
      report(null);
      change({ remote: device, isPlaying: false });
    },

    playHere: (positionSeconds, isPlaying) => {
      const { remote, queue } = state;

      if (remote !== null) {
        void command(remote.clientId, { kind: 'stop' });
      }

      change({ remote: null });

      if (queue !== null) {
        load(queue, positionSeconds, isPlaying);
      }
    },

    obey: (sent) => {
      if (sent.kind === 'play') {
        change({ remote: null });

        void fetchTracks(sent.trackIds).then((tracks) => {
          if (tracks.length === 0) {
            return;
          }

          load(
            startQueue(tracks, sent.index, { repeat: state.queue?.repeat ?? 'off', random }),
            sent.positionSeconds,
            sent.isPlaying,
          );
        });

        return;
      }

      if (sent.kind === 'stop') {
        audio.pause();
        change({ queue: null, current: null, isPlaying: false, positionSeconds: 0 });
        tell(true);

        return;
      }

      if (sent.kind === 'volume') {
        audio.volume = sent.volume;
        change({ volume: sent.volume });
        tell(true);

        return;
      }

      const local = { ...state, remote: null };

      state = local;

      if (sent.kind === 'pause') {
        player.pause();
      } else if (sent.kind === 'resume') {
        player.resume();
      } else if (sent.kind === 'next') {
        player.next();
      } else if (sent.kind === 'previous') {
        player.previous();
      } else {
        player.seek(sent.positionSeconds);
      }
    },
  };

  return player;
};

export type {
  AudioLike,
  MusicPlayer,
  MusicPlayerDeps,
  MusicPlayerState,
  PlayOptions,
  RemoteDevice,
};

export { createMusicPlayer };
