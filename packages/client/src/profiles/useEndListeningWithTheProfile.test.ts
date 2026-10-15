import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEndListeningWithTheProfile } from './useEndListeningWithTheProfile';

const leave = vi.hoisted(() => vi.fn<() => void>());
const close = vi.hoisted(() => vi.fn<() => void>());

vi.mock('@ValenceClient/music/theMusicPlayer', () => ({ theMusicPlayer: () => ({ leave }) }));
vi.mock('@ValenceClient/books/theAudiobookPlayer', () => ({
  theAudiobookPlayer: () => ({ close }),
}));

beforeEach(() => {
  leave.mockReset();
  close.mockReset();
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
});
