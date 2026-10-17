import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAdminAttention } from './useAdminAttention';

const ANSWERS: Record<string, object> = {
  '/api/requests/availability': { isEnabled: false },
  '/api/admin/library-health': {
    checkedAt: '2026-10-17T00:00:00.000Z',
    unmatched: { total: 2, items: [] },
    noArtwork: { total: 0, items: [] },
    duplicate: { total: 1, items: [] },
    unreadable: { total: 0, items: [] },
  },
  '/api/admin/updates': {
    current: '1.6.0',
    latest: '1.7.0',
    isNewer: true,
    publishedAt: null,
    notes: null,
    url: null,
    checkedAt: null,
    isEnabled: true,
    problem: null,
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useAdminAttention', () => {
  it('counts library problems and names a newer release', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((path: string) => {
        const key = Object.keys(ANSWERS).find((one) => path.startsWith(one));

        return Promise.resolve(
          new Response(
            JSON.stringify(key === undefined ? { records: [], total: 4 } : ANSWERS[key]),
          ),
        );
      }),
    );
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: cache }, children);

    const { result } = renderHook(() => useAdminAttention(), { wrapper });

    await waitFor(() => {
      expect(result.current.health).toBe(3);
    });
    expect(result.current.latest).toBe('1.7.0');
    expect(result.current.jobs).toBe(4);
    expect(result.current.requests).toBe(0);
  });
});
