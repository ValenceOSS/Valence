import { afterEach, describe, expect, it, vi } from 'vitest';
import { samplePixels } from './samplePixels';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('samplePixels', () => {
  it('reads nothing where the browser has no canvas to draw on', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    expect(samplePixels(document.createElement('img'))).toBeNull();
  });
});
