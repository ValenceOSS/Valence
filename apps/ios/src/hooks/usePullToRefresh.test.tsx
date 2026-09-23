import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePullToRefresh } from './usePullToRefresh';
import type { ReactNode } from 'react';

describe('usePullToRefresh', () => {
  it('asks again for everything on screen when the page is pulled down', async () => {
    const cache = new QueryClient();
    const refetching = jest.spyOn(cache, 'refetchQueries').mockResolvedValue();
    const { result } = await renderHook(() => usePullToRefresh(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={cache}>{children}</QueryClientProvider>
      ),
    });

    await act(() => {
      result.current.props.onRefresh?.();
    });

    expect(refetching).toHaveBeenCalledWith({ type: 'active' });
  });
});
