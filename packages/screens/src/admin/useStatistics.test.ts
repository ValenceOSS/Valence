import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useStatistics } from './useStatistics';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useStatistics', () => {
  it('asks for the range on the viewer’s own clock', async () => {
    const fetched = vi.fn(() => Promise.resolve(new Response('{}', { status: 500 })));

    vi.stubGlobal('fetch', fetched);
    const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: cache }, children);

    renderHook(() => useStatistics('month'), { wrapper });

    await waitFor(() => {
      expect(fetched).toHaveBeenCalled();
    });
    expect(String(fetched.mock.calls[0])).toContain('range=month');
    expect(String(fetched.mock.calls[0])).toContain('zone=');
  });
});
