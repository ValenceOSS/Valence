import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { tellOfNewWords } from './tellOfNewWords';
import { useNewWords } from './useNewWords';

describe('useNewWords', () => {
  it('counts up each time the app starts speaking new words', () => {
    const { result } = renderHook(() => useNewWords());
    const before = result.current;

    act(() => {
      tellOfNewWords();
    });

    expect(result.current).toBe(before + 1);
  });
});
