import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIsArm } from './useIsArm';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useIsArm', () => {
  it('says no until the browser answers, then what it answered', async () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      userAgentData: { getHighEntropyValues: () => Promise.resolve({ architecture: 'arm' }) },
    });

    const { result } = renderHook(() => useIsArm());

    expect(result.current).toBe(false);
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('stays no on a computer that is not ARM', async () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' });

    const { result } = renderHook(() => useIsArm());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});
