import { act, renderHook } from '@testing-library/react-native';
import { useRemoteVolume } from '@ValenceTv/playback/useRemoteVolume';

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useRemoteVolume', () => {
  it('sets the player to the volume it is turned to, and shows it for a moment', async () => {
    const player = { volume: 1 };
    const { result } = await renderHook(() => useRemoteVolume(player));

    expect(result.current.isShown).toBe(false);

    await act(async () => {
      result.current.turnTo(0.4);
      await Promise.resolve();
    });

    expect(player.volume).toBe(0.4);
    expect(result.current.level).toBe(0.4);
    expect(result.current.isShown).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(3_000);
      await Promise.resolve();
    });

    expect(result.current.isShown).toBe(false);
  });

  it('keeps the volume between nothing and all the way up', async () => {
    const player = { volume: 1 };
    const { result } = await renderHook(() => useRemoteVolume(player));

    await act(async () => {
      result.current.turnTo(1.4);
      await Promise.resolve();
    });

    expect(player.volume).toBe(1);

    await act(async () => {
      result.current.turnTo(-0.2);
      await Promise.resolve();
    });

    expect(player.volume).toBe(0);
  });

  it('carries the volume on to the next player', async () => {
    const first = { volume: 1 };
    const { result, unmount } = await renderHook(() => useRemoteVolume(first));

    await act(async () => {
      result.current.turnTo(0.25);
      await Promise.resolve();
    });

    await unmount();

    const next = { volume: 1 };

    await renderHook(() => useRemoteVolume(next));

    expect(next.volume).toBe(0.25);
  });

  it('plays all the way up again once the film has properly stopped', async () => {
    const first = { volume: 1 };
    const { result, unmount } = await renderHook(() => useRemoteVolume(first));

    await act(async () => {
      result.current.turnTo(0.25);
      await Promise.resolve();
    });

    await unmount();

    await act(async () => {
      jest.advanceTimersByTime(2_000);
      await Promise.resolve();
    });

    const later = { volume: 0.5 };

    await renderHook(() => useRemoteVolume(later));

    expect(later.volume).toBe(1);
  });
});
