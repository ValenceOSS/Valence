import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HOME } from '@ValenceClient/navigation/readLocation';
import { useHomeForAnotherProfile } from './useHomeForAnotherProfile';

const AS_DAN: { watcher: string | null } = { watcher: 'dan' };

describe('useHomeForAnotherProfile', () => {
  it('leaves the first profile wherever the address put them', () => {
    const replace = vi.fn();

    renderHook(() => {
      useHomeForAnotherProfile('dan', replace);
    });

    expect(replace).not.toHaveBeenCalled();
  });

  it('goes home as another profile takes over', () => {
    const replace = vi.fn();
    const { rerender } = renderHook(
      ({ watcher }: { watcher: string | null }) => {
        useHomeForAnotherProfile(watcher, replace);
      },
      { initialProps: AS_DAN },
    );

    rerender({ watcher: null });
    rerender({ watcher: 'kid' });

    expect(replace).toHaveBeenCalledExactlyOnceWith(HOME);
  });

  it('stays put where the same profile is chosen again', () => {
    const replace = vi.fn();
    const { rerender } = renderHook(
      ({ watcher }: { watcher: string | null }) => {
        useHomeForAnotherProfile(watcher, replace);
      },
      { initialProps: AS_DAN },
    );

    rerender({ watcher: null });
    rerender({ watcher: 'dan' });

    expect(replace).not.toHaveBeenCalled();
  });
});
