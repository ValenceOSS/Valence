import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useIsHeroBandGone } from './useIsHeroBandGone';

describe('useIsHeroBandGone', () => {
  it('reads the band as in sight before the page has scrolled', () => {
    const { result } = renderHook(() => useIsHeroBandGone());

    expect(result.current).toBe(false);
  });
});
