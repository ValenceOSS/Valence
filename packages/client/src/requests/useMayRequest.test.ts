import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useMayRequest } from './useMayRequest';
import type { MyPermissions } from '@ValenceContracts/schemas/Permission';
import type { RequestsAvailability } from '@ValenceContracts/schemas/Requests';

const fetchMyPermissions = vi.fn<() => Promise<MyPermissions>>();
const fetchRequestsAvailability = vi.fn<() => Promise<RequestsAvailability>>();

vi.mock('@ValenceClient/session/fetchMyPermissions', () => ({
  fetchMyPermissions: () => fetchMyPermissions(),
}));

vi.mock('@ValenceClient/requests/fetchRequests', () => ({
  fetchRequestsAvailability: () => fetchRequestsAvailability(),
  fetchRequestsOverview: vi.fn(),
}));

beforeEach(() => {
  fetchMyPermissions
    .mockReset()
    .mockResolvedValue({ permissions: ['requests.ask'], isAdministrator: false });
  fetchRequestsAvailability
    .mockReset()
    .mockResolvedValue({ isEnabled: true, kinds: ['film', 'series', 'artist', 'album', 'book'] });
});

describe('useMayRequest', () => {
  it('lets somebody ask where requesting is on and they may ask for films', async () => {
    const { result } = renderHookInACache(() => useMayRequest());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('lets somebody who may only ask for music ask', async () => {
    fetchMyPermissions.mockResolvedValue({
      permissions: ['requests.askMusic'],
      isAdministrator: false,
    });

    const { result } = renderHookInACache(() => useMayRequest());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('does not while requesting is switched off on this server', async () => {
    fetchRequestsAvailability.mockResolvedValue({
      isEnabled: false,
      kinds: ['film', 'series', 'artist', 'album', 'book'],
    });

    const { result } = renderHookInACache(() => useMayRequest());

    await waitFor(() => {
      expect(fetchRequestsAvailability).toHaveBeenCalled();
    });

    expect(result.current).toBe(false);
  });

  it('does not for somebody who may ask for nothing', async () => {
    fetchMyPermissions.mockResolvedValue({ permissions: [], isAdministrator: false });

    const { result } = renderHookInACache(() => useMayRequest());

    await waitFor(() => {
      expect(fetchMyPermissions).toHaveBeenCalled();
    });

    expect(result.current).toBe(false);
  });

  it('does not let somebody ask for films where only music is taken, and they may not ask for it', async () => {
    fetchRequestsAvailability.mockResolvedValue({ isEnabled: true, kinds: ['artist', 'album'] });

    const { result } = renderHookInACache(() => useMayRequest());

    await waitFor(() => {
      expect(fetchRequestsAvailability).toHaveBeenCalled();
    });
    expect(result.current).toBe(false);
  });
});
