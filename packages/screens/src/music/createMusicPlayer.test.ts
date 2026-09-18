import { describe, expect, it, vi } from 'vitest';
import { createMusicPlayer } from './createMusicPlayer';
import type { AudioLike, MusicPlayerDeps } from './createMusicPlayer';
import type { MusicPreferences } from '@ValenceClient/music/musicPreferences';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';

const track = (n: number, codec = 'flac'): MusicTrack => ({
  id: `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`,
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title: `Track ${n.toString()}`,
  artists: [{ id: '00000000-0000-4000-8000-00000000a7a7', name: 'Sleep Token' }],
  album: { id: '00000000-0000-4000-8000-00000000a1b1', title: 'Album', hasArtwork: true },
  discNumber: null,
  trackNumber: n,
  durationSeconds: 200,
  codec,
  isLossless: true,
  bitDepth: 16,
  sampleRate: 44_100,
  bitrateKbps: 900,
  hasLyrics: false,
  isFavourite: false,
});

const THREE = [1, 2, 3].map((n) => track(n));

const fakeAudio = () => {
  const handlers = new Map<string, (() => void)[]>();

  const fire = (type: string): void => {
    for (const handler of handlers.get(type) ?? []) {
      handler();
    }
  };

  const audio: AudioLike & { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> } = {
    src: '',
    currentTime: 0,
    duration: Number.NaN,
    volume: 1,
    muted: false,
    paused: true,
    play: vi.fn(() => {
      audio.paused = false;
      fire('playing');

      return Promise.resolve();
    }),
    pause: vi.fn(() => {
      audio.paused = true;
      fire('pause');
    }),
    addEventListener: (type, listener) => {
      handlers.set(type, [...(handlers.get(type) ?? []), listener]);
    },
  };

  return { audio, fire };
};

const build = (overrides: Partial<MusicPlayerDeps> = {}, kept: Partial<MusicPreferences> = {}) => {
  const { audio, fire } = fakeAudio();
  const saved: Partial<MusicPreferences>[] = [];

  const deps: MusicPlayerDeps = {
    audio,
    streamUrl: (trackId, quality) => `/stream/${trackId}?quality=${quality}`,
    canPlay: () => true,
    fetchTracks: (ids) => Promise.resolve(THREE.filter((one) => ids.includes(one.id))),
    report: vi.fn(),
    command: vi.fn(() => Promise.resolve(true)),
    preferences: {
      read: () => ({ quality: 'lossless', volume: 0.8, isMuted: false, ...kept }),
      save: (change) => {
        saved.push(change);
      },
    },
    now: () => 1000,
    random: () => 0.3,
    ...overrides,
  };

  return { player: createMusicPlayer(deps), audio, fire, deps, saved };
};

describe('createMusicPlayer', () => {
  it('plays the track pressed, as the file it is', () => {
    const { player, audio } = build();

    player.play(THREE, 1);

    expect(audio.src).toBe(`/stream/${THREE[1]?.id ?? ''}?quality=lossless`);
    expect(audio.play).toHaveBeenCalled();
    expect(player.read()).toMatchObject({ isPlaying: true, current: THREE[1] });
  });

  it('asks for the highest encode where this device cannot play the file', () => {
    const { player, audio } = build({ canPlay: () => false });

    player.play([track(1, 'alac')], 0);

    expect(audio.src).toContain('quality=high');
    expect(player.read().playingQuality).toBe('high');
  });

  it('plays the next track when one ends', () => {
    const { player, audio, fire } = build();

    player.play(THREE, 0);
    fire('ended');

    expect(audio.src).toContain(THREE[1]?.id ?? 'missing');
  });

  it('stops at the end of the queue', () => {
    const { player, fire } = build();

    player.play(THREE, 2);
    fire('ended');

    expect(player.read().isPlaying).toBe(false);
  });

  it('starts the song again on previous once it is a few seconds in', () => {
    const { player, audio } = build();

    player.play(THREE, 1);
    audio.currentTime = 30;
    player.previous();

    expect(audio.currentTime).toBe(0);
    expect(player.read().current).toBe(THREE[1]);
  });

  it('goes back a track on previous near the start of a song', () => {
    const { player, audio } = build();

    player.play(THREE, 1);
    audio.currentTime = 1;
    player.previous();

    expect(player.read().current).toBe(THREE[0]);
  });

  it('skips on next', () => {
    const { player } = build();

    player.play(THREE, 0);
    player.next();

    expect(player.read().current).toBe(THREE[1]);
  });

  it('pauses and resumes', () => {
    const { player, audio } = build();

    player.play(THREE, 0);
    player.toggle();

    expect(audio.pause).toHaveBeenCalled();
    expect(player.read().isPlaying).toBe(false);

    player.toggle();

    expect(player.read().isPlaying).toBe(true);
  });

  it('seeks where it is told', () => {
    const { player, audio } = build();

    player.play(THREE, 0);
    player.seek(42);

    expect(audio.currentTime).toBe(42);
    expect(player.read().positionSeconds).toBe(42);
  });

  it('keeps the volume on this device', () => {
    const { player, audio, saved } = build();

    player.setVolume(0.4);

    expect(audio.volume).toBe(0.4);
    expect(saved).toContainEqual({ volume: 0.4, isMuted: false });
  });

  it('starts at the volume this device last used', () => {
    const { audio } = build({}, { volume: 0.25, isMuted: true });

    expect(audio.volume).toBe(0.25);
    expect(audio.muted).toBe(true);
  });

  it('plays the same track again at a new quality, where it had got to', () => {
    const { player, audio, fire } = build();

    player.play(THREE, 0);
    audio.currentTime = 50;
    player.setQuality('low');
    fire('loadedmetadata');

    expect(audio.src).toContain('quality=low');
    expect(audio.currentTime).toBe(50);
  });

  it('tries the highest encode where the file fails partway, before giving up', () => {
    const { player, audio, fire } = build();

    player.play(THREE, 0);
    fire('error');

    expect(audio.src).toContain('quality=high');
    expect(player.read().problem).toBeNull();

    fire('error');

    expect(player.read().problem).not.toBeNull();
  });

  it('says what it is playing, so this person’s other devices can show it', () => {
    const { player, deps } = build();

    player.play(THREE, 0);

    expect(deps.report).toHaveBeenCalledWith(
      expect.objectContaining({
        trackId: THREE[0]?.id,
        title: 'Track 1',
        artists: ['Sleep Token'],
      }),
    );
  });

  it('says what plays next alongside what is playing', () => {
    const { player, deps } = build();

    player.play(THREE, 0);

    expect(deps.report).toHaveBeenCalledWith(
      expect.objectContaining({ upNext: [THREE[1]?.id, THREE[2]?.id], isMuted: false }),
    );
  });

  it('says it has stopped when told to stop', () => {
    const { player, deps } = build();

    player.play(THREE, 0);
    player.stop();

    expect(deps.report).toHaveBeenLastCalledWith(null);
    expect(player.read().queue).toBeNull();
  });

  describe('playing on another device', () => {
    it('hands what is left of the queue over, from where it had got to, and goes quiet here', () => {
      const { player, audio, deps } = build();

      player.play(THREE, 1);
      audio.currentTime = 12;
      player.playOn({ clientId: 'phone', label: 'iPhone' });

      expect(deps.command).toHaveBeenCalledWith('phone', {
        kind: 'play',
        trackIds: [THREE[1]?.id, THREE[2]?.id],
        index: 0,
        positionSeconds: 12,
        isPlaying: true,
      });
      expect(audio.pause).toHaveBeenCalled();
      expect(player.read().remote).toEqual({ clientId: 'phone', label: 'iPhone' });
    });

    it('sends every button to the other device while controlling it', () => {
      const { player, audio, deps } = build();

      player.play(THREE, 0);
      player.playOn({ clientId: 'phone', label: 'iPhone' });
      audio.play.mockClear();
      player.next();
      player.seek(30);

      expect(deps.command).toHaveBeenCalledWith('phone', { kind: 'next' });
      expect(deps.command).toHaveBeenCalledWith('phone', { kind: 'seek', positionSeconds: 30 });
      expect(audio.play).not.toHaveBeenCalled();
    });

    it('takes playback back, stopping the other device', () => {
      const { player, audio, deps, fire } = build();

      player.play(THREE, 0);
      player.playOn({ clientId: 'phone', label: 'iPhone' });
      player.playHere(64, true);
      fire('loadedmetadata');

      expect(deps.command).toHaveBeenLastCalledWith('phone', { kind: 'stop' });
      expect(player.read().remote).toBeNull();
      expect(audio.currentTime).toBe(64);
    });
  });

  describe('keeping in step with the device it controls', () => {
    const reportFrom = (overrides = {}) => ({
      trackId: THREE[1]?.id ?? '',
      title: 'Track 2',
      artists: ['Sleep Token'],
      albumId: THREE[1]?.album.id ?? '',
      hasArtwork: true,
      positionSeconds: 30,
      durationSeconds: 200,
      isPlaying: true,
      volume: 0.35,
      isMuted: false,
      quality: 'lossless' as const,
      upNext: [THREE[2]?.id ?? ''],
      reportedAtMs: 1000,
      ...overrides,
    });

    const controlling = () => {
      const built = build();

      built.player.play(THREE, 0);
      built.player.playOn({ clientId: 'phone', label: 'iPhone' });

      return built;
    };

    it('follows the other device on to its next song, and what comes after', async () => {
      const { player } = controlling();

      player.mirror(reportFrom());

      await vi.waitFor(() => {
        expect(player.read().current).toBe(THREE[1]);
      });
      expect(player.read().queue?.tracks).toEqual([THREE[1], THREE[2]]);
    });

    it('takes on the other device’s volume and mute', () => {
      const { player } = controlling();

      player.mirror(reportFrom({ volume: 0.2, isMuted: true }));

      expect(player.read()).toMatchObject({ volume: 0.2, isMuted: true });
    });

    it('ignores a report once it is playing here again', () => {
      const { player } = build();

      player.mirror(reportFrom({ volume: 0.1 }));

      expect(player.read().volume).toBe(0.8);
    });

    it('starts the other device on the song pressed, not the top of the list', () => {
      const { player, deps } = controlling();

      player.play(THREE, 2);

      expect(deps.command).toHaveBeenLastCalledWith('phone', {
        kind: 'play',
        trackIds: [THREE[2]?.id],
        index: 0,
        positionSeconds: 0,
        isPlaying: true,
      });
    });

    it('shows a volume change straight away and sends it once the slider settles', () => {
      vi.useFakeTimers();

      try {
        const { player, deps } = controlling();

        player.setVolume(0.6);
        player.setVolume(0.4);

        expect(player.read().volume).toBe(0.4);
        expect(deps.command).not.toHaveBeenCalledWith(
          'phone',
          expect.objectContaining({ kind: 'volume' }),
        );

        vi.advanceTimersByTime(250);

        expect(deps.command).toHaveBeenCalledWith('phone', { kind: 'volume', volume: 0.4 });
        expect(deps.command).not.toHaveBeenCalledWith('phone', { kind: 'volume', volume: 0.6 });
      } finally {
        vi.useRealTimers();
      }
    });

    it('mutes the other device, not this one', () => {
      const { player, deps, audio } = controlling();

      player.toggleMute();

      expect(deps.command).toHaveBeenCalledWith('phone', { kind: 'mute', isMuted: true });
      expect(audio.muted).toBe(false);
    });

    it('queues songs on the other device', () => {
      const { player, deps } = controlling();

      player.playNext([THREE[0] ?? THREE[1] ?? track(9)]);
      player.addToQueue([track(9)]);

      expect(deps.command).toHaveBeenCalledWith('phone', {
        kind: 'enqueue',
        trackIds: [THREE[0]?.id],
        where: 'next',
      });
      expect(deps.command).toHaveBeenCalledWith('phone', {
        kind: 'enqueue',
        trackIds: [track(9).id],
        where: 'last',
      });
    });

    it('skips ahead and takes songs out of the other device’s queue by how far ahead they are', () => {
      const { player, deps } = controlling();

      player.jumpTo(2);
      player.removeFromQueue(1);

      expect(deps.command).toHaveBeenCalledWith('phone', { kind: 'skipTo', ahead: 2 });
      expect(deps.command).toHaveBeenCalledWith('phone', { kind: 'unqueue', ahead: 1 });
    });

    it('hands on from where the other device had got to, and stops it', async () => {
      const { player, deps } = controlling();

      player.mirror(reportFrom({ positionSeconds: 30, reportedAtMs: 1000, isPlaying: false }));

      await vi.waitFor(() => {
        expect(player.read().current).toBe(THREE[1]);
      });

      player.playOn({ clientId: 'tv', label: 'Living room' });

      expect(deps.command).toHaveBeenCalledWith('tv', {
        kind: 'play',
        trackIds: [THREE[1]?.id, THREE[2]?.id],
        index: 0,
        positionSeconds: 30,
        isPlaying: true,
      });
      expect(deps.command).toHaveBeenCalledWith('phone', { kind: 'stop' });
    });
  });

  describe('being told what to do by another device', () => {
    it('plays what it is handed, from where it was', async () => {
      const { player, audio, fire } = build();

      player.obey({
        kind: 'play',
        trackIds: [THREE[2]?.id ?? ''],
        index: 0,
        positionSeconds: 9,
        isPlaying: true,
      });

      await vi.waitFor(() => {
        expect(player.read().current).toBe(THREE[2]);
      });
      fire('loadedmetadata');

      expect(audio.currentTime).toBe(9);
    });

    it('pauses, skips and seeks when told to', () => {
      const { player, audio } = build();

      player.play(THREE, 0);
      player.obey({ kind: 'pause' });

      expect(player.read().isPlaying).toBe(false);

      player.obey({ kind: 'next' });

      expect(player.read().current).toBe(THREE[1]);

      player.obey({ kind: 'seek', positionSeconds: 20 });

      expect(audio.currentTime).toBe(20);
    });

    it('mutes and sets its volume when told to, and says so', () => {
      const { player, audio, deps } = build();

      player.play(THREE, 0);
      player.obey({ kind: 'mute', isMuted: true });

      expect(audio.muted).toBe(true);

      player.obey({ kind: 'volume', volume: 0.3 });

      expect(audio.volume).toBe(0.3);
      expect(deps.report).toHaveBeenLastCalledWith(
        expect.objectContaining({ volume: 0.3, isMuted: false }),
      );
    });

    it('queues what it is sent, next or last', async () => {
      const { player } = build();

      player.play([THREE[0] ?? track(1)], 0);
      player.obey({ kind: 'enqueue', trackIds: [THREE[2]?.id ?? ''], where: 'next' });

      await vi.waitFor(() => {
        expect(player.read().queue?.tracks).toHaveLength(2);
      });
    });

    it('skips ahead and takes songs out when told to', () => {
      const { player } = build();

      player.play(THREE, 0);
      player.obey({ kind: 'unqueue', ahead: 1 });

      expect(player.read().queue?.order).toEqual([0, 2]);

      player.obey({ kind: 'skipTo', ahead: 1 });

      expect(player.read().current).toBe(THREE[2]);
    });

    it('stops when told to, leaving nothing queued', () => {
      const { player } = build();

      player.play(THREE, 0);
      player.obey({ kind: 'stop' });

      expect(player.read().current).toBeNull();
    });
  });

  it('tells whoever is listening that something changed', () => {
    const { player } = build();
    const listener = vi.fn();

    player.subscribe(listener);
    player.play(THREE, 0);

    expect(listener).toHaveBeenCalled();
  });
});
