import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { samplePixels } from './samplePixels';
import { useAmbientColour } from './useAmbientColour';

vi.mock('./samplePixels', () => ({ samplePixels: vi.fn() }));

const orange = Uint8ClampedArray.from(
  Array.from({ length: 32 * 18 }, () => [220, 120, 20, 255]).flat(),
);

afterEach(() => {
  vi.mocked(samplePixels).mockReset();
});

describe('useAmbientColour', () => {
  it('has no colours before there is a picture', () => {
    const { result } = renderHook(() => useAmbientColour(null));

    expect(result.current).toEqual([]);
    expect(samplePixels).not.toHaveBeenCalled();
  });

  it('reads the colours of the picture it is given', () => {
    vi.mocked(samplePixels).mockReturnValue(orange);

    const picture = document.createElement('img');
    const { result } = renderHook(() => useAmbientColour(picture));
    const [strongest = ''] = result.current;

    expect(samplePixels).toHaveBeenCalledWith(picture);
    expect(result.current).toHaveLength(3);
    expect(parseInt(strongest.slice(1, 3), 16)).toBeGreaterThan(
      parseInt(strongest.slice(5, 7), 16),
    );
  });

  it('keeps the colours it had when a picture cannot be read', () => {
    vi.mocked(samplePixels).mockReturnValueOnce(orange).mockReturnValueOnce(null);

    const { result, rerender } = renderHook(
      ({ picture }: { picture: HTMLImageElement }) => useAmbientColour(picture),
      { initialProps: { picture: document.createElement('img') } },
    );
    const before = result.current;

    rerender({ picture: document.createElement('img') });

    expect(result.current).toEqual(before);
  });
});
