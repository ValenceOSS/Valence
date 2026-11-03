import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useArtworkTint } from './useArtworkTint';

describe('useArtworkTint', () => {
  it('has no tint without a picture to read', () => {
    const { result } = renderHook(() => useArtworkTint(null));

    expect(result.current).toBeNull();
  });
});
