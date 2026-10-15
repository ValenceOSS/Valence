import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { HrefOf } from '@ValenceScreens/navigation/HrefOf';
import { useHrefOf } from './useHrefOf';

describe('useHrefOf', () => {
  it('writes addresses where the shell gives a way to', () => {
    const write = () => '/films?inspecting=a';
    const { result } = renderHook(() => useHrefOf(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <HrefOf.Provider value={write}>{children}</HrefOf.Provider>
      ),
    });

    expect(result.current?.({ inspecting: 'a' })).toBe('/films?inspecting=a');
  });

  it('has none outside the shell, where a control stays a button', () => {
    const { result } = renderHook(() => useHrefOf());

    expect(result.current).toBeNull();
  });
});
