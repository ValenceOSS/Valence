import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLetterNudge } from './useLetterNudge';

describe('useLetterNudge', () => {
  it('moves nothing where the letter cannot be measured', () => {
    const { result } = renderHook(() => useLetterNudge('D', 'sans-serif', 600));

    expect(result.current).toBeNull();
  });
});
