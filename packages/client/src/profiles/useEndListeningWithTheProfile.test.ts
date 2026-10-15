import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEndListeningWithTheProfile } from './useEndListeningWithTheProfile';

const leave = vi.hoisted(() => vi.fn<() => void>());
const close = vi.hoisted(() => vi.fn<() => void>());
const playing = vi.hoisted((): { queue: string | null; remote: string | null } => ({
  queue: null,
  remote: null,
}));

vi.mock('@ValenceClient/music/theMusicPlayer', () => ({
  theMusicPlayer: () => ({ leave, read: () => playing }),
}));
vi.mock('@ValenceClient/books/theAudiobookPlayer', () => ({
  theAudiobookPlayer: () => ({ close }),
}));

beforeEach(() => {
  leave.mockReset();
  close.mockReset();
  playing.queue = 'a queue';
  playing.remote = null;
});

describe('useEndListeningWithTheProfile', () => {
  it('lets the music and the audiobook play on while the same profile is watching', () => {
    const { rerender } = renderHook(
      ({ profileId }) => {
        useEndListeningWithTheProfile('acc-1', profileId);
      },
      { initialProps: { profileId: 'dan' } },
    );

    rerender({ profileId: 'dan' });

    expect(leave).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it('stops them once another profile is watching', () => {
    const { rerender } = renderHook(
      ({ profileId }) => {
        useEndListeningWithTheProfile('acc-1', profileId);
      },
      { initialProps: { profileId: 'dan' } },
    );

    rerender({ profileId: 'kid' });

    expect(leave).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('stops them once nobody is signed in any more', () => {
    const { unmount } = renderHook(() => {
      useEndListeningWithTheProfile('acc-1', 'dan');
    });

    leave.mockClear();
    unmount();

    expect(leave).toHaveBeenCalledTimes(1);
  });

  it('tells the server nothing where no music was playing', () => {
    playing.queue = null;

    const { rerender } = renderHook(
      ({ profileId }) => {
        useEndListeningWithTheProfile('acc-1', profileId);
      },
      { initialProps: { profileId: 'dan' } },
    );

    rerender({ profileId: 'kid' });

    expect(leave).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('lets go of music playing on another device', () => {
    playing.queue = null;
    playing.remote = 'the kitchen';

    const { unmount } = renderHook(() => {
      useEndListeningWithTheProfile('acc-1', 'dan');
    });

    unmount();

    expect(leave).toHaveBeenCalledTimes(1);
  });
});
