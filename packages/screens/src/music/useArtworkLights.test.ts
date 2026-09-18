import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useArtworkLights } from './useArtworkLights';

const reading = vi.hoisted(() => ({ readLights: vi.fn(() => [{ color: 'rgb(1 2 3)' }]) }));

vi.mock('@ValenceScreens/library/readLights', () => reading);

const pictures: { onload: (() => void) | null; src: string }[] = [];

vi.stubGlobal(
  'Image',
  class {
    onload: (() => void) | null = null;
    src = '';

    constructor() {
      pictures.push(this);
    }
  },
);

afterEach(() => {
  pictures.length = 0;
});

describe('useArtworkLights', () => {
  it('casts no light where there is no picture', () => {
    const { result } = renderHook(() => useArtworkLights(null));

    expect(result.current).toEqual([]);
  });

  it('casts the picture’s lights once it has loaded', () => {
    const { result } = renderHook(() => useArtworkLights('/cover.webp'));

    expect(result.current).toEqual([]);

    act(() => {
      pictures[0]?.onload?.();
    });

    expect(result.current).toEqual([{ color: 'rgb(1 2 3)' }]);
  });
});
