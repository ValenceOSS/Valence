import { act, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { controlDevice, readControlledDevice } from '@ValenceClient/video/controlledDevice';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useVideoRemote } from '@ValenceClient/video/useVideoRemote';
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

const NOW = 1_000_000;

const watching = (overrides: Partial<VideoNowWatching> = {}): VideoNowWatching => ({
  mediaId: '00000000-0000-4000-8000-000000000001',
  title: 'Arrival',
  subtitle: null,
  hasBackdrop: true,
  positionSeconds: 60,
  durationSeconds: 6000,
  isPlaying: true,
  reportedAtMs: NOW - 10_000,
  ...overrides,
});

const theTv = (nowWatching: VideoNowWatching | null): VideoDevice => ({
  clientId: 'tv',
  label: 'Living room',
  kind: 'tv',
  nowWatching,
});

const hearAChange = () => {
  act(() => {
    changes.heard.forEach((onChanged) => {
      onChanged();
    });
  });
};

let clock = NOW;

beforeEach(() => {
  clock = NOW;
  vi.spyOn(Date, 'now').mockImplementation(() => clock);
  changes.heard = [];
  devices.fetchVideoDevices.mockReset();
  devices.fetchVideoDevices.mockResolvedValue([]);
  devices.sendVideoCommand.mockClear();
});

afterEach(() => {
  controlDevice(null);
  vi.restoreAllMocks();
});

describe('useVideoRemote', () => {
  it('controls nothing until a film is sent somewhere', () => {
    const { result } = renderHookInACache(() => useVideoRemote());

    expect(result.current.device).toBeNull();
    expect(result.current.watching).toBeNull();
    expect(result.current.positionSeconds).toBe(0);
  });

  it('does not ask for the devices while it controls nothing', async () => {
    renderHookInACache(() => useVideoRemote());

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(devices.fetchVideoDevices).not.toHaveBeenCalled();
  });

  it('shows what the device it controls says it is watching', async () => {
    devices.fetchVideoDevices.mockResolvedValue([theTv(watching())]);
    controlDevice({ clientId: 'tv', label: 'Living room' });

    const { result } = renderHookInACache(() => useVideoRemote());

    await waitFor(() => {
      expect(result.current.watching?.title).toBe('Arrival');
    });
    expect(result.current.device).toEqual({ clientId: 'tv', label: 'Living room' });
  });

  it('moves a playing film on from where it was last reported', async () => {
    devices.fetchVideoDevices.mockResolvedValue([theTv(watching())]);
    controlDevice({ clientId: 'tv', label: 'Living room' });

    const { result } = renderHookInACache(() => useVideoRemote());

    await waitFor(() => {
      expect(result.current.positionSeconds).toBe(70);
    });

    clock = NOW + 2_000;

    await waitFor(() => {
      expect(result.current.positionSeconds).toBe(72);
    });
  });

  it('holds a paused film where it was reported', async () => {
    devices.fetchVideoDevices.mockResolvedValue([theTv(watching({ isPlaying: false }))]);
    controlDevice({ clientId: 'tv', label: 'Living room' });

    const { result } = renderHookInACache(() => useVideoRemote());

    await waitFor(() => {
      expect(result.current.watching).not.toBeNull();
    });
    expect(result.current.positionSeconds).toBe(60);
  });

  it('sends a command to the device it controls', () => {
    controlDevice({ clientId: 'tv', label: 'Living room' });

    const { result } = renderHookInACache(() => useVideoRemote());

    result.current.send({ kind: 'pause' });

    expect(devices.sendVideoCommand).toHaveBeenCalledWith('tv', { kind: 'pause' });
  });

  it('sends nothing while it controls nothing', () => {
    const { result } = renderHookInACache(() => useVideoRemote());

    result.current.send({ kind: 'pause' });

    expect(devices.sendVideoCommand).not.toHaveBeenCalled();
  });

  it('stops being the remote when let go', () => {
    controlDevice({ clientId: 'tv', label: 'Living room' });

    const { result } = renderHookInACache(() => useVideoRemote());

    act(() => {
      result.current.release();
    });

    expect(result.current.device).toBeNull();
    expect(readControlledDevice()).toBeNull();
  });

  it('keeps waiting for a device that has not yet started what it was sent', async () => {
    devices.fetchVideoDevices.mockResolvedValue([theTv(null)]);
    controlDevice({ clientId: 'tv', label: 'Living room' });

    renderHookInACache(() => useVideoRemote());

    await waitFor(() => {
      expect(devices.fetchVideoDevices).toHaveBeenCalled();
    });
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(readControlledDevice()).toEqual({ clientId: 'tv', label: 'Living room' });
  });

  it('lets go once the device it controls says it has stopped', async () => {
    devices.fetchVideoDevices.mockResolvedValue([theTv(watching())]);
    controlDevice({ clientId: 'tv', label: 'Living room' });

    const { result } = renderHookInACache(() => useVideoRemote());

    await waitFor(() => {
      expect(result.current.watching).not.toBeNull();
    });

    devices.fetchVideoDevices.mockResolvedValue([theTv(null)]);
    hearAChange();

    await waitFor(() => {
      expect(result.current.device).toBeNull();
    });
  });

  it('lets go once the device it controls closes', async () => {
    devices.fetchVideoDevices.mockResolvedValue([theTv(watching())]);
    controlDevice({ clientId: 'tv', label: 'Living room' });

    const { result } = renderHookInACache(() => useVideoRemote());

    await waitFor(() => {
      expect(result.current.watching).not.toBeNull();
    });

    devices.fetchVideoDevices.mockResolvedValue([]);
    hearAChange();

    await waitFor(() => {
      expect(readControlledDevice()).toBeNull();
    });
  });
});
