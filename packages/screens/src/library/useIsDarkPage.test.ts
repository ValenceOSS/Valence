import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { chooseTheme } from '@ValenceClient/shell/theme';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { useIsDarkPage } from './useIsDarkPage';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

afterEach(() => {
  forgetPlatform();
  vi.unstubAllGlobals();
});

/**
 * A machine whose preference for dark can change while the page is open, telling whoever listens.
 *
 * @param isDark - Whether it prefers dark at first.
 * @returns How to change its mind.
 */
const aMachinePreferring = (isDark: boolean): { prefer: (dark: boolean) => void } => {
  const listeners = new Set<() => void>();
  let prefersDark = isDark;

  vi.stubGlobal('matchMedia', (query: string) => ({
    get matches() {
      return prefersDark && query.includes('dark');
    },
    media: query,
    onchange: null,
    addEventListener: (_kind: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_kind: string, listener: () => void) => {
      listeners.delete(listener);
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  return {
    prefer: (dark) => {
      prefersDark = dark;

      for (const listener of listeners) {
        listener();
      }
    },
  };
};

describe('useIsDarkPage', () => {
  it('follows the theme as somebody changes it, rather than the one it first saw', () => {
    chooseTheme('light');

    const { result } = renderHook(() => useIsDarkPage());

    expect(result.current).toBe(false);

    act(() => {
      chooseTheme('dark');
    });

    expect(result.current).toBe(true);

    act(() => {
      chooseTheme('light');
    });

    expect(result.current).toBe(false);
  });

  it('follows the machine as it changes, where nothing was chosen', () => {
    chooseTheme('system');

    const machine = aMachinePreferring(true);
    const { result } = renderHook(() => useIsDarkPage());

    expect(result.current).toBe(true);

    act(() => {
      machine.prefer(false);
    });

    expect(result.current).toBe(false);

    act(() => {
      machine.prefer(true);
    });

    expect(result.current).toBe(true);
  });
});
