import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useSiteTheme } from './useSiteTheme';

afterEach(() => {
  document.documentElement.removeAttribute('data-theme');
});

describe('useSiteTheme', () => {
  it('reads dark when the page has no light theme set', () => {
    const { result } = renderHook(() => useSiteTheme());

    expect(result.current).toBe('dark');
  });

  it('follows the page when its theme changes', async () => {
    const { result } = renderHook(() => useSiteTheme());

    await act(async () => {
      document.documentElement.setAttribute('data-theme', 'light');
      await Promise.resolve();
    });

    expect(result.current).toBe('light');
  });
});
