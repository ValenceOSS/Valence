import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  controlDevice,
  dismissDevice,
  readControlledDevice,
} from '@ValenceClient/video/controlledDevice';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useFollowTheTelevision } from '@ValenceClient/video/useFollowTheTelevision';
import type { VideoDevice, VideoNowWatching } from '@ValenceContracts/schemas/VideoRemote';

const changes = vi.hoisted(() => {
  const heard: (() => void)[] = [];

  return { heard };
});

vi.mock('@ValenceClient/devices/watchDeviceChanges', () => ({
  watchDeviceChanges: (_which: string, onChanged: () => void) => {
    changes.heard.push(onChanged);

    return () => {};
  },
}));

const devices = vi.hoisted(() => ({
  fetchVideoDevices: vi.fn((): Promise<VideoDevice[]> => Promise.resolve([])),
  sendVideoCommand: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@ValenceClient/video/videoDevices', () => devices);

const NOW = 10_000_000;

const watching = (overrides: Partial<VideoNowWatching> = {}): VideoNowWatching => ({
  mediaId: '00000000-0000-4000-8000-000000000001',
  title: 'Arrival',
  subtitle: null,
  hasBackdrop: true,
  positionSeconds: 60,
  durationSeconds: 6000,
  isPlaying: true,
  hasNext: false,
  settings: [],
  skip: null,
  stepsBy: null,
  canStepOn: false,
  canStepBack: false,
  reportedAtMs: NOW - 5_000,
  ...overrides,
});

const aDevice = (
  clientId: string,
  nowWatching: VideoNowWatching | null,
  kind: VideoDevice['kind'] = 'tv',
): VideoDevice => ({
  clientId,
  label: clientId === 'tv' ? 'Living room' : 'Bedroom',
  kind,
  nowWatching,
});

const hearAChange = () => {
  act(() => {
    changes.heard.forEach((onChanged) => {
      onChanged();
    });
  });
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

let clock = NOW;

beforeEach(() => {
  clock = NOW;
  vi.spyOn(Date, 'now').mockImplementation(() => clock);
  changes.heard = [];
  devices.fetchVideoDevices.mockReset();
  devices.fetchVideoDevices.mockResolvedValue([]);
});

afterEach(() => {
  controlDevice({ clientId: 'bedroom', label: 'Bedroom' });
  controlDevice({ clientId: 'tv', label: 'Living room' });
  controlDevice(null);
  vi.restoreAllMocks();
});

describe('useFollowTheTelevision', () => {
  it('becomes the remote for a television already playing when it opens', async () => {
    devices.fetchVideoDevices.mockResolvedValue([aDevice('tv', watching())]);

    renderHookInACache(() => {
      useFollowTheTelevision(false);
    });

    await waitFor(() => {
      expect(readControlledDevice()).toEqual({ clientId: 'tv', label: 'Living room' });
    });
  });

  it('becomes the remote for a television the moment it starts playing', async () => {
    devices.fetchVideoDevices.mockResolvedValue([aDevice('tv', null)]);

    renderHookInACache(() => {
      useFollowTheTelevision(false);
    });

    await settle();
    expect(readControlledDevice()).toBeNull();

    devices.fetchVideoDevices.mockResolvedValue([aDevice('tv', watching())]);
    hearAChange();

    await waitFor(() => {
      expect(readControlledDevice()).toEqual({ clientId: 'tv', label: 'Living room' });
    });
  });

  it('leaves a television alone that has not said what it is watching lately', async () => {
    devices.fetchVideoDevices.mockResolvedValue([
      aDevice('tv', watching({ reportedAtMs: NOW - 60_000 })),
    ]);

    renderHookInACache(() => {
      useFollowTheTelevision(false);
    });

    await settle();

    expect(readControlledDevice()).toBeNull();
  });

  it('follows only a television, since nothing else obeys a remote', async () => {
    devices.fetchVideoDevices.mockResolvedValue([aDevice('laptop', watching(), 'browser')]);

    renderHookInACache(() => {
      useFollowTheTelevision(false);
    });

    await settle();

    expect(readControlledDevice()).toBeNull();
  });

  it('follows nothing while this device shows a film of its own, nor what was already playing after', async () => {
    devices.fetchVideoDevices.mockResolvedValue([aDevice('tv', watching())]);

    const { rerender } = renderHookInACache(
      ({ isBusy }: { isBusy: boolean }) => {
        useFollowTheTelevision(isBusy);
      },
      { initialProps: { isBusy: true } },
    );

    await settle();
    expect(readControlledDevice()).toBeNull();

    rerender({ isBusy: false });
    await settle();

    expect(readControlledDevice()).toBeNull();
  });

  it('moves on to another television that starts playing', async () => {
    devices.fetchVideoDevices.mockResolvedValue([aDevice('tv', watching())]);

    renderHookInACache(() => {
      useFollowTheTelevision(false);
    });

    await waitFor(() => {
      expect(readControlledDevice()?.clientId).toBe('tv');
    });

    devices.fetchVideoDevices.mockResolvedValue([
      aDevice('tv', watching()),
      aDevice('bedroom', watching()),
    ]);
    hearAChange();

    await waitFor(() => {
      expect(readControlledDevice()?.clientId).toBe('bedroom');
    });
  });

  it('stays away from a television whose remote was put away while it goes on to the next episode', async () => {
    devices.fetchVideoDevices.mockResolvedValue([aDevice('tv', watching())]);

    renderHookInACache(() => {
      useFollowTheTelevision(false);
    });

    await waitFor(() => {
      expect(readControlledDevice()?.clientId).toBe('tv');
    });

    act(() => {
      dismissDevice('tv');
    });

    devices.fetchVideoDevices.mockResolvedValue([aDevice('tv', null)]);
    hearAChange();
    await settle();

    clock = NOW + 3_000;
    devices.fetchVideoDevices.mockResolvedValue([
      aDevice(
        'tv',
        watching({ reportedAtMs: clock, mediaId: '00000000-0000-4000-8000-000000000002' }),
      ),
    ]);
    hearAChange();
    await settle();

    expect(readControlledDevice()).toBeNull();
  });

  it('follows that television again once it has stopped for a while and starts something new', async () => {
    devices.fetchVideoDevices.mockResolvedValue([aDevice('tv', watching())]);

    renderHookInACache(() => {
      useFollowTheTelevision(false);
    });

    await waitFor(() => {
      expect(readControlledDevice()?.clientId).toBe('tv');
    });

    act(() => {
      dismissDevice('tv');
    });

    devices.fetchVideoDevices.mockResolvedValue([aDevice('tv', null)]);
    hearAChange();
    await settle();

    clock = NOW + 10 * 60_000;
    devices.fetchVideoDevices.mockResolvedValue([aDevice('tv', watching({ reportedAtMs: clock }))]);
    hearAChange();

    await waitFor(() => {
      expect(readControlledDevice()?.clientId).toBe('tv');
    });
  });
});
