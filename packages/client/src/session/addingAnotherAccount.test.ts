import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setAddingAnotherAccount, useAddingAnotherAccount } from './addingAnotherAccount';

afterEach(() => {
  setAddingAnotherAccount(false);
});

describe('useAddingAnotherAccount', () => {
  it('follows whether another account is being signed in', () => {
    const { result } = renderHook(() => useAddingAnotherAccount());

    expect(result.current).toBe(false);

    act(() => {
      setAddingAnotherAccount(true);
    });

    expect(result.current).toBe(true);
  });
});
