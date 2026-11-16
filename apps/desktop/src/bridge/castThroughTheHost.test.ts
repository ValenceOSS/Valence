import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { fakeTheHostsEvents } from '@ValenceDesktop/testing/fakeTheHostsEvents';
import { castThroughTheHost } from './castThroughTheHost';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn() }));

const LIVING_ROOM = {
  id: 'Chromecast-1._googlecast._tcp.local.',
  name: 'Living Room TV',
  model: 'Chromecast',
};

let host = fakeTheHostsEvents();

beforeEach(() => {
  host = fakeTheHostsEvents();
  vi.mocked(invoke).mockResolvedValue(null);
});

afterEach(() => {
  vi.mocked(invoke).mockReset();
  vi.mocked(listen).mockReset();
});

describe('castThroughTheHost', () => {
  it('has nothing to cast to before the host has said', () => {
    expect(castThroughTheHost().now()).toEqual({
      state: 'unavailable',
      devices: [],
      device: null,
    });
  });

  it('asks the host once how things stand, for a device heard before the page listened', async () => {
    const said = { state: 'available', devices: [LIVING_ROOM], device: null };

    vi.mocked(invoke).mockImplementation((command) =>
      Promise.resolve(command === 'cast_now' ? said : null),
    );

    const casting = castThroughTheHost();

    await vi.waitFor(() => {
      expect(casting.now()).toEqual(said);
    });
  });

  it('keeps up with what the host says about the devices on the network', async () => {
    const casting = castThroughTheHost();
    const listener = vi.fn();

    casting.whenChanged(listener);
    await vi.waitFor(() => {
      expect(host.listening('valence:cast-changed')).toBe(1);
    });
    host.emit('valence:cast-changed', {
      state: 'connected',
      devices: [LIVING_ROOM],
      device: LIVING_ROOM,
    });

    expect(casting.now().device).toEqual(LIVING_ROOM);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ state: 'connected' }));
  });

  it('asks the host to connect to the device chosen, and says whether it did', async () => {
    vi.mocked(invoke).mockResolvedValue(true);

    await expect(castThroughTheHost().connect(LIVING_ROOM.id)).resolves.toBe(true);
    expect(invoke).toHaveBeenCalledWith('cast_connect', { deviceId: LIVING_ROOM.id });
  });

  it('takes a host that could not be asked as a device that was not connected to', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('gone'));

    await expect(castThroughTheHost().connect(LIVING_ROOM.id)).resolves.toBe(false);
  });

  it('hands the host the stream as a path on the server, for it to make whole', async () => {
    vi.mocked(invoke).mockResolvedValue(true);

    const took = await castThroughTheHost().load({
      address: '/api/playback/cast/ticket/master.m3u8',
      contentType: 'application/x-mpegurl',
      title: 'Arrival',
      startSeconds: 61,
    });

    expect(took).toBe(true);
    expect(invoke).toHaveBeenCalledWith('cast_load', {
      path: '/api/playback/cast/ticket/master.m3u8',
      contentType: 'application/x-mpegurl',
      title: 'Arrival',
      startSeconds: 61,
    });
  });

  it('asks the host for the address a device on the network reaches a stream at', async () => {
    vi.mocked(invoke).mockResolvedValue('http://192.168.1.10:8420/api/playback/cast/t/index.m3u8');

    await expect(
      castThroughTheHost().reachableAddress('/api/playback/cast/t/index.m3u8'),
    ).resolves.toBe('http://192.168.1.10:8420/api/playback/cast/t/index.m3u8');
    expect(invoke).toHaveBeenCalledWith('cast_address_of', {
      path: '/api/playback/cast/t/index.m3u8',
    });
  });

  it('has no address where the host gives none it can read', async () => {
    vi.mocked(invoke).mockResolvedValue(42);

    await expect(castThroughTheHost().reachableAddress('/api/x')).resolves.toBeNull();
  });

  it('passes on where the device has got to', async () => {
    const listener = vi.fn();

    castThroughTheHost().whenPlayed(listener);
    await vi.waitFor(() => {
      expect(host.listening('valence:cast-played')).toBe(1);
    });
    host.emit('valence:cast-played', { seconds: 1500, isPlaying: true });

    expect(listener).toHaveBeenCalledWith({ seconds: 1500, isPlaying: true });
  });

  it('sends the device its controls through the host', () => {
    const casting = castThroughTheHost();

    casting.play();
    casting.pause();
    casting.seek(90);
    casting.setVolume(0.5);
    void casting.disconnect();

    expect(vi.mocked(invoke).mock.calls.map(([command, args]) => [command, args])).toEqual([
      ['cast_now', undefined],
      ['cast_play', undefined],
      ['cast_pause', undefined],
      ['cast_seek', { seconds: 90 }],
      ['cast_volume', { level: 0.5 }],
      ['cast_disconnect', undefined],
    ]);
  });
});
