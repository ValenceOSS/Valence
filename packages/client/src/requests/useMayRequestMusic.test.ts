import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { useMayRequestMusic } from './useMayRequestMusic';
import type { MyPermissions } from '@ValenceContracts/schemas/Permission';

const fetchMyPermissions = vi.fn<() => Promise<MyPermissions>>();
const fetchRequestsAvailability = vi.fn<() => Promise<{ isEnabled: boolean }>>();

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
    .mockResolvedValue({ permissions: ['requests.askMusic'], isAdministrator: false });
  fetchRequestsAvailability.mockReset().mockResolvedValue({ isEnabled: true });
});

describe('useMayRequestMusic', () => {
  it('lets somebody who may ask for music ask', async () => {
    const { result } = renderHookInACache(() => useMayRequestMusic());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('does not for somebody who may ask only for films and programmes', async () => {
    fetchMyPermissions.mockResolvedValue({ permissions: ['requests.ask'], isAdministrator: false });

    const { result } = renderHookInACache(() => useMayRequestMusic());

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(result.current).toBe(false);
  });

  it('does not while requesting is switched off on this server', async () => {
    fetchRequestsAvailability.mockResolvedValue({ isEnabled: false });

    const { result } = renderHookInACache(() => useMayRequestMusic());

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(result.current).toBe(false);
  });
});
