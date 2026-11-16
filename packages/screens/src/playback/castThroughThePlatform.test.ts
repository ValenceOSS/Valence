import { describe, expect, it, vi } from 'vitest';
import type { Casting } from '@ValenceClient/platform/Platform.types';
import type { CastingNow } from '@ValenceContracts/schemas/CastingNow';
import type { CastPlayed } from '@ValenceContracts/schemas/CastPlayed';
import { castThroughThePlatform } from './castThroughThePlatform';

const LIVING_ROOM = { id: 'living-room', name: 'Living Room TV', model: 'Chromecast' };

/**
 * A client that casts, whose state and media a test can move.
 *
 * @param first - Where casting stands to begin with.
 * @returns The client's casting, and how to make it say things.
 */
const aClient = (
  first: CastingNow = { state: 'connected', devices: [LIVING_ROOM], device: LIVING_ROOM },
) => {
  let now = first;
  const changes = new Set<(said: CastingNow) => void>();
  const plays = new Set<(said: CastPlayed) => void>();
  const casting = {
    now: () => now,
    whenChanged: vi.fn((listener: (said: CastingNow) => void) => {
      changes.add(listener);
      listener(now);

      return () => {
        changes.delete(listener);
      };
    }),
    connect: vi.fn(() => Promise.resolve(true)),
    disconnect: vi.fn(() => Promise.resolve()),
    load: vi.fn(() => Promise.resolve(true)),
    whenPlayed: vi.fn((listener: (said: CastPlayed) => void) => {
      plays.add(listener);

      return () => {
        plays.delete(listener);
      };
    }),
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    reachableAddress: vi.fn((path: string) => Promise.resolve(`http://192.168.1.10:8420${path}`)),
  } satisfies Casting;

  return {
    casting,
    change: (said: CastingNow) => {
      now = said;
      changes.forEach((listener) => {
        listener(said);
      });
    },
    play: (said: CastPlayed) => {
      plays.forEach((listener) => {
        listener(said);
      });
    },
  };
};

describe('castThroughThePlatform', () => {
  it('says where casting stands and which devices there are, for the player to list', () => {
    const { casting, change } = aClient({
      state: 'available',
      devices: [LIVING_ROOM],
      device: null,
    });
    const heard = vi.fn();

    castThroughThePlatform(casting).watch(heard);
    change({ state: 'connected', devices: [LIVING_ROOM], device: LIVING_ROOM });

    expect(heard.mock.calls).toEqual([
      [{ state: 'available', devices: [LIVING_ROOM], deviceId: null }],
      [{ state: 'connected', devices: [LIVING_ROOM], deviceId: 'living-room' }],
    ]);
  });

  it('can cast from any address, since the client names this computer as the device sees it', () => {
    expect(castThroughThePlatform(aClient().casting).canReach('http://127.0.0.1:41847')).toBe(true);
  });

  it('connects to the device chosen, and stops casting when asked', async () => {
    const { casting } = aClient();
    const caster = castThroughThePlatform(casting);

    await expect(caster.castTo('living-room')).resolves.toBe(true);
    caster.stop();

    expect(casting.connect).toHaveBeenCalledWith('living-room');
    expect(casting.disconnect).toHaveBeenCalled();
  });

  it('hands over the stream as the path the server gave, as a stream', async () => {
    const { casting } = aClient();

    await castThroughThePlatform(casting).load({
      address: '/api/playback/cast/ticket/master.m3u8',
      title: 'Arrival',
      startSeconds: 61,
    });

    expect(casting.load).toHaveBeenCalledWith({
      address: '/api/playback/cast/ticket/master.m3u8',
      contentType: 'application/x-mpegurl',
      title: 'Arrival',
      startSeconds: 61,
    });
  });

  it('follows where the device has got to and whether it plays', () => {
    const { casting, play } = aClient();
    const seconds = vi.fn();
    const playing = vi.fn();
    const stop = castThroughThePlatform(casting).follow(seconds, playing);

    play({ seconds: 1500, isPlaying: true });
    stop();
    play({ seconds: 1501, isPlaying: true });

    expect(seconds.mock.calls).toEqual([[1500]]);
    expect(playing.mock.calls).toEqual([[true]]);
  });

  it('pauses a device that plays and plays a device that is paused', () => {
    const { casting, play } = aClient();
    const caster = castThroughThePlatform(casting);

    caster.follow(vi.fn(), vi.fn());
    play({ seconds: 10, isPlaying: true });
    caster.playOrPause();
    play({ seconds: 10, isPlaying: false });
    caster.playOrPause();

    expect(casting.pause).toHaveBeenCalledOnce();
    expect(casting.play).toHaveBeenCalledOnce();
  });

  it('moves the device and sets its volume', () => {
    const { casting } = aClient();
    const caster = castThroughThePlatform(casting);

    caster.seek(90);
    caster.setVolume(0.25);

    expect(casting.seek).toHaveBeenCalledWith(90);
    expect(casting.setVolume).toHaveBeenCalledWith(0.25);
  });

  it('asks the client for the address the network reaches a stream at', async () => {
    await expect(
      castThroughThePlatform(aClient().casting).reachableAddress('/api/playback/cast/t/x.m3u8'),
    ).resolves.toBe('http://192.168.1.10:8420/api/playback/cast/t/x.m3u8');
  });

  it('names the device being cast to', () => {
    expect(castThroughThePlatform(aClient().casting).deviceName()).toBe('Living Room TV');
    expect(
      castThroughThePlatform(
        aClient({ state: 'available', devices: [], device: null }).casting,
      ).deviceName(),
    ).toBeNull();
  });

  it('draws no list of its own when asked to choose, since the player lists the devices', () => {
    const { casting } = aClient();

    castThroughThePlatform(casting).choose();

    expect(casting.connect).not.toHaveBeenCalled();
  });
});
