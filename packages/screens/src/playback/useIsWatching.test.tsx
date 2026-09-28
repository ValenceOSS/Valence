import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useIsWatching } from './useIsWatching';

afterEach(() => {
  delete document.documentElement.dataset['valenceWatching'];
});

describe('useIsWatching', () => {
  it('says nothing is playing where the player has not marked the window', () => {
    const { result } = renderHook(() => useIsWatching());

    expect(result.current).toBe(false);
  });

  it('knows a film is playing where the player already has the window', () => {
    document.documentElement.dataset['valenceWatching'] = 'shown';

    const { result } = renderHook(() => useIsWatching());

    expect(result.current).toBe(true);
  });

  it('follows the player taking the window and giving it back', async () => {
    const { result } = renderHook(() => useIsWatching());

    act(() => {
      document.documentElement.dataset['valenceWatching'] = 'hidden';
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    act(() => {
      delete document.documentElement.dataset['valenceWatching'];
    });

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
