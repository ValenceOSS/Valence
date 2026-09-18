import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mostColourful, useArtworkTint } from './useArtworkTint';

describe('mostColourful', () => {
  it('picks the most colourful of the colours read', () => {
    expect(mostColourful(['rgb(20, 20, 20)', 'rgb(180, 30, 30)', 'rgb(200, 200, 200)'])).toBe(
      'rgb(180, 30, 30)',
    );
  });

  it('picks nothing out of nothing', () => {
    expect(mostColourful([])).toBeNull();
  });

  it('reads colours written with spaces, the way the lights are read', () => {
    expect(mostColourful(['rgb(20 20 20)', 'rgb(180 30 30)'])).toBe('rgb(180 30 30)');
  });

  it('skips a colour it cannot read', () => {
    expect(mostColourful(['nonsense', 'rgb(10, 90, 10)'])).toBe('rgb(10, 90, 10)');
  });
});

describe('useArtworkTint', () => {
  it('has no tint where there is no picture', () => {
    const { result } = renderHook(() => useArtworkTint(null));

    expect(result.current).toBeNull();
  });

  it('has no tint until the picture has been read', () => {
    const { result } = renderHook(() => useArtworkTint('/cover.webp'));

    expect(result.current).toBeNull();
  });
});
