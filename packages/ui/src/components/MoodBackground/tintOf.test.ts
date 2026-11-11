import { afterEach, describe, expect, it, vi } from 'vitest';
import { tintOf } from './tintOf';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('tintOf', () => {
  it('reads a colour through a drawing surface', () => {
    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        getContext() {
          return {
            fillStyle: '',
            fillRect: () => undefined,
            getImageData: () => ({ data: [255, 128, 0, 255] }),
          };
        }
      },
    );

    const [red, green, blue] = tintOf('#ff8000');

    expect(red).toBe(1);
    expect(green).toBeCloseTo(0.5, 1);
    expect(blue).toBe(0);
  });

  it('is black where there is nothing to draw on', () => {
    vi.stubGlobal('OffscreenCanvas', undefined);

    expect(tintOf('#ff8000')).toEqual([0, 0, 0]);
  });
});
