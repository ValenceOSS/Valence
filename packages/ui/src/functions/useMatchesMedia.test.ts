import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMatchesMedia } from './useMatchesMedia';

type Listener = () => void;

const askedAbout = (matches: boolean) => {
  const listeners = new Set<Listener>();

  const query = {
    matches,
    addEventListener: (_name: string, listen: Listener) => {
      listeners.add(listen);
    },
    removeEventListener: (_name: string, listen: Listener) => {
      listeners.delete(listen);
    },
  };

  const answerDifferently = (now: boolean): void => {
    query.matches = now;

    for (const listen of listeners) {
      listen();
    }
  };

  return { query, answerDifferently, listeners };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useMatchesMedia', () => {
  it('asks the browser the query it is given, and answers as the browser does', () => {
    const { query } = askedAbout(false);
    const asked = vi.fn(() => query);

    vi.stubGlobal('matchMedia', asked);

    const { result } = renderHook(() => useMatchesMedia('(min-width: 48rem)'));

    expect(result.current).toBe(false);
    expect(asked).toHaveBeenCalledWith('(min-width: 48rem)');
  });

  it('answers again when the page stops or starts matching', () => {
    const { query, answerDifferently } = askedAbout(true);

    vi.stubGlobal('matchMedia', () => query);

    const { result } = renderHook(() => useMatchesMedia('(min-width: 48rem)'));

    act(() => {
      answerDifferently(false);
    });

    expect(result.current).toBe(false);
  });

  it('stops listening once nobody is drawing with it', () => {
    const { query, listeners } = askedAbout(true);

    vi.stubGlobal('matchMedia', () => query);

    const { unmount } = renderHook(() => useMatchesMedia('(min-width: 48rem)'));

    expect(listeners.size).toBe(1);

    unmount();

    expect(listeners.size).toBe(0);
  });

  it('answers yes where there is nothing to ask', () => {
    vi.stubGlobal('matchMedia', undefined);

    const { result } = renderHook(() => useMatchesMedia('(min-width: 48rem)'));

    expect(result.current).toBe(true);
  });
});
