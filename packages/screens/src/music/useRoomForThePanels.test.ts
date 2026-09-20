import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRoomForThePanels } from './useRoomForThePanels';

type Listener = () => void;

const stubWidth = (matches: boolean) => {
  const listeners = new Set<Listener>();
  const query = {
    matches,
    addEventListener: (_: string, listener: Listener) => listeners.add(listener),
    removeEventListener: (_: string, listener: Listener) => listeners.delete(listener),
  };

  vi.stubGlobal('matchMedia', () => query);

  return {
    change: (next: boolean) => {
      query.matches = next;
      listeners.forEach((listener) => {
        listener();
      });
    },
  };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useRoomForThePanels', () => {
  it('says there is room where the page is wide', () => {
    stubWidth(true);

    expect(renderHook(() => useRoomForThePanels()).result.current).toBe(true);
  });

  it('says there is not on a narrow page', () => {
    stubWidth(false);

    expect(renderHook(() => useRoomForThePanels()).result.current).toBe(false);
  });

  it('follows the page as it is resized', () => {
    const width = stubWidth(true);
    const { result } = renderHook(() => useRoomForThePanels());

    act(() => {
      width.change(false);
    });

    expect(result.current).toBe(false);
  });

  it('assumes there is room where it cannot ask', () => {
    vi.stubGlobal('matchMedia', undefined);

    expect(renderHook(() => useRoomForThePanels()).result.current).toBe(true);
  });
});
