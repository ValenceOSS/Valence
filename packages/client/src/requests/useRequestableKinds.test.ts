import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useRequestableKinds } from './useRequestableKinds';
import type { RequestsAvailability } from '@ValenceContracts/schemas/Requests';

const fetchRequestsAvailability = vi.fn<() => Promise<RequestsAvailability>>();

vi.mock('@ValenceClient/requests/fetchRequests', () => ({
  fetchRequestsAvailability: () => fetchRequestsAvailability(),
  fetchRequestsOverview: vi.fn(),
}));

beforeEach(() => {
  fetchRequestsAvailability.mockReset().mockResolvedValue({ isEnabled: true, kinds: ['film'] });
});

describe('useRequestableKinds', () => {
  it('names the kinds a library takes requests for', async () => {
    const { result } = renderHookInACache(() => useRequestableKinds());

    await waitFor(() => {
      expect([...result.current]).toEqual(['film']);
    });
  });

  it('names none where requesting is off', async () => {
    fetchRequestsAvailability.mockResolvedValue({ isEnabled: false, kinds: ['film'] });

    const { result } = renderHookInACache(() => useRequestableKinds());

    await waitFor(() => {
      expect(fetchRequestsAvailability).toHaveBeenCalled();
    });
    expect(result.current.size).toBe(0);
  });
});
