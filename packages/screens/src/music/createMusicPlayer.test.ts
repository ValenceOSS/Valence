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
