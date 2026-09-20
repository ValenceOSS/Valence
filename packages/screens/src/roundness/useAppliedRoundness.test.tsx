import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAppliedRoundness } from './useAppliedRoundness';
import type { ReactNode } from 'react';

const fetchAppearance = vi.hoisted(() => vi.fn());
const offline = vi.hoisted(() => ({ isOffline: false }));

vi.mock('@ValenceClient/offline/useOfflineMode', () => ({
  useOfflineMode: () => ({ isOffline: offline.isOffline }),
}));

vi.mock('@ValenceClient/appearance/fetchAppearance', () => ({ fetchAppearance }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

afterEach(() => {
  offline.isOffline = false;
  document.documentElement.style.removeProperty('--radius-scale');
});

describe('useAppliedRoundness', () => {
  it('puts the roundness the server chose on the document', async () => {
    fetchAppearance.mockResolvedValue({ roundness: 'round' });

    renderHook(() => useAppliedRoundness(), { wrapper });

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--radius-scale')).toBe('1.6');
    });
  });

  it('leaves everything as it always was where the server cannot say', async () => {
    fetchAppearance.mockRejectedValue(new Error('offline'));

    renderHook(() => useAppliedRoundness(), { wrapper });

    await waitFor(() => {
      expect(fetchAppearance).toHaveBeenCalled();
    });

    expect(document.documentElement.style.getPropertyValue('--radius-scale')).toBe('1');
  });

  it('asks the server nothing while there is no server', () => {
    offline.isOffline = true;
    fetchAppearance.mockReset();

    renderHook(() => useAppliedRoundness(), { wrapper });

    expect(fetchAppearance).not.toHaveBeenCalled();
  });
});
