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
    titles: 1,
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
  it('counts titles with library problems, not problems, and names a newer release', async () => {
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
      expect(result.current.health).toBe(1);
    });
    expect(result.current.latest).toBe('1.7.0');
    expect(result.current.isLatestADevBuild).toBe(false);
    expect(result.current.jobs).toBe(4);
    expect(result.current.requests).toBe(0);
  });

  it('counts failed requests apart from download clients that are not answering', async () => {
    const answers: Record<string, object> = {
      ...ANSWERS,
      '/api/requests/availability': { isEnabled: true },
      '/api/admin/requests': {
        address: 'http://requests:8421',
        isReachable: true,
        problemCode: null,
        checkedAt: '2026-11-03T00:00:00.000Z',
        status: null,
        work: {
          awaitingApproval: 0,
          searching: 0,
          downloading: 0,
          failed: 2,
          arrivedToday: 0,
          downloadBytesPerSecond: 0,
          clients: {
            total: 2,
            reachable: 1,
            failing: [{ name: 'qBittorrent', problem: { code: 'x', message: 'Down', values: {} } }],
          },
        },
      },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn((path: string) => {
        const key = Object.keys(answers).find((one) => path.startsWith(one));

        return Promise.resolve(
          new Response(
            JSON.stringify(key === undefined ? { records: [], total: 0 } : answers[key]),
          ),
        );
      }),
    );
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: cache }, children);

    const { result } = renderHook(() => useAdminAttention(), { wrapper });

    await waitFor(() => {
      expect(result.current.failedRequests).toBe(2);
    });
    expect(result.current.downloads).toBe(1);
  });

  it('names a newer release before a newer dev build, where a dev build is behind both', async () => {
    const answers: Record<string, object> = {
      ...ANSWERS,
      '/api/admin/updates': {
        ...ANSWERS['/api/admin/updates'],
        current: '1.7.0-dev.a1a1a1a',
        latest: '1.7.0',
        isNewer: true,
        dev: {
          commit: 'a1a1a1a',
          newest: 'c3c3c3c',
          builtAt: null,
          isNewer: true,
          isOffMain: false,
          behindBy: 2,
          commits: [],
          problem: null,
        },
      },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn((path: string) => {
        const key = Object.keys(answers).find((one) => path.startsWith(one));

        return Promise.resolve(
          new Response(
            JSON.stringify(key === undefined ? { records: [], total: 0 } : answers[key]),
          ),
        );
      }),
    );
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: cache }, children);

    const { result } = renderHook(() => useAdminAttention(), { wrapper });

    await waitFor(() => {
      expect(result.current.latest).toBe('1.7.0');
    });
    expect(result.current.isLatestADevBuild).toBe(false);
  });
});
