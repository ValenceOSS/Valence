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
 * Has the machine say whether it prefers dark.
 *
 * @param isDark - Whether it does.
 */
const theMachinePrefers = (isDark: boolean): void => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: isDark && query.includes('dark'),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
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

  it('follows the machine where nothing was chosen', () => {
    chooseTheme('system');
    theMachinePrefers(true);

    expect(renderHook(() => useIsDarkPage()).result.current).toBe(true);

    theMachinePrefers(false);

    expect(renderHook(() => useIsDarkPage()).result.current).toBe(false);
  });
});
