import { act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useVideoDevices } from '@ValenceClient/video/useVideoDevices';
import type { VideoDevice } from '@ValenceContracts/schemas/VideoRemote';

const changes = vi.hoisted(() => {
  const heard: { which: string; onChanged: () => void }[] = [];

  return { heard, stopped: 0 };
});

vi.mock('@ValenceClient/devices/watchDeviceChanges', () => ({
  watchDeviceChanges: (which: string, onChanged: () => void) => {
    changes.heard.push({ which, onChanged });

    return () => {
      changes.stopped += 1;
    };
  },
}));

const devices = vi.hoisted(() => ({
  fetchVideoDevices: vi.fn((): Promise<VideoDevice[]> => Promise.resolve([])),
}));

vi.mock('@ValenceClient/video/videoDevices', () => devices);

const aDevice = (clientId: string, kind: VideoDevice['kind']): VideoDevice => ({
  clientId,
  label: clientId,
  kind,
  nowWatching: null,
});

beforeEach(() => {
  changes.heard = [];
  changes.stopped = 0;
  devices.fetchVideoDevices.mockReset();
  devices.fetchVideoDevices.mockResolvedValue([]);
  installPlatform(aFakePlatform({ thisClientId: () => 'this-tab' }));
});

describe('useVideoDevices', () => {
  it('leaves this device out of the list of places to send a film', async () => {
    devices.fetchVideoDevices.mockResolvedValue([
      aDevice('this-tab', 'browser'),
      aDevice('tv', 'tv'),
    ]);

    const { result } = renderHookInACache(() => useVideoDevices());

    await waitFor(() => {
      expect(result.current.map((device) => device.clientId)).toEqual(['tv']);
    });
  });

  it('puts televisions first', async () => {
    devices.fetchVideoDevices.mockResolvedValue([
      aDevice('laptop', 'browser'),
      aDevice('desk', null),
      aDevice('living room', 'tv'),
      aDevice('mac', 'desktop'),
      aDevice('bedroom', 'tv'),
    ]);

    const { result } = renderHookInACache(() => useVideoDevices());

    await waitFor(() => {
      expect(result.current).toHaveLength(5);
    });
    expect(result.current.slice(0, 2).map((device) => device.clientId)).toEqual([
      'living room',
      'bedroom',
    ]);
  });

  it('reads the list again when the socket says the film devices changed', async () => {
    const { result } = renderHookInACache(() => useVideoDevices());

    await waitFor(() => {
      expect(devices.fetchVideoDevices).toHaveBeenCalledTimes(1);
    });

    devices.fetchVideoDevices.mockResolvedValue([aDevice('tv', 'tv')]);

    expect(changes.heard.map((heard) => heard.which)).toEqual(['videoDevicesChanged']);

    act(() => {
      changes.heard[0]?.onChanged();
    });

    await waitFor(() => {
      expect(result.current.map((device) => device.clientId)).toEqual(['tv']);
    });
    expect(devices.fetchVideoDevices).toHaveBeenCalledTimes(2);
  });

  it('neither asks nor listens while nothing is showing the list', async () => {
    const { result } = renderHookInACache(() => useVideoDevices(false));

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(devices.fetchVideoDevices).not.toHaveBeenCalled();
    expect(changes.heard).toEqual([]);
    expect(result.current).toEqual([]);
  });

  it('stops listening once gone', () => {
    const { unmount } = renderHookInACache(() => useVideoDevices());

    unmount();

    expect(changes.stopped).toBe(1);
  });
});
