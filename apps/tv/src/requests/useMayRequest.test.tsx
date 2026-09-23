import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import { useMayRequest } from '@ValenceTv/requests/useMayRequest';
import type { ReactNode } from 'react';

const mockAvailability = jest.fn(() => Promise.resolve({ isEnabled: true }));

const mockHeld = new Set<string>();

jest.mock('@ValenceClient/requests/fetchRequests', () => ({
  ...jest.requireActual<object>('@ValenceClient/requests/fetchRequests'),
  fetchRequestsAvailability: () => mockAvailability(),
}));

jest.mock('@ValenceClient/session/useWhatIMayDo', () => ({
  useWhatIMayDo: () => ({
    may: (permission: string) => mockHeld.has(permission),
    mayAdminister: false,
    isLoading: false,
  }),
}));

const aCache = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const WithTheCache = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  WithTheCache.displayName = 'WithTheCache';

  return WithTheCache;
};

beforeEach(() => {
  mockHeld.clear();
  mockAvailability.mockClear();
});

describe('useMayRequest', () => {
  it('offers asking where requests are on and the viewer may ask', async () => {
    mockHeld.add('requests.ask');

    const { result } = await renderHook(() => useMayRequest(), { wrapper: aCache() });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('does not offer asking to a viewer who may not', async () => {
    const { result } = await renderHook(() => useMayRequest(), { wrapper: aCache() });

    await waitFor(() => {
      expect(mockAvailability).toHaveBeenCalled();
    });
    expect(result.current).toBe(false);
  });

  it('does not offer asking where requests are switched off', async () => {
    mockHeld.add('requests.ask');
    mockAvailability.mockResolvedValueOnce({ isEnabled: false });

    const { result } = await renderHook(() => useMayRequest(), { wrapper: aCache() });

    await waitFor(() => {
      expect(mockAvailability).toHaveBeenCalled();
    });
    expect(result.current).toBe(false);
  });
});
