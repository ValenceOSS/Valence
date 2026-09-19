import { afterEach, describe, expect, it, vi } from 'vitest';
import { NO_WORK } from '@ValenceContracts/schemas/Requests';
import {
  checkRequestsNow,
  fetchRequestsAvailability,
  fetchRequestsOverview,
} from './fetchRequests';

const AN_OVERVIEW = {
  address: 'http://requests:8421',
  isReachable: true,
  checkedAt: '2026-09-19T12:00:00.000Z',
  status: {
    version: '0.4.0',
    vpn: {
      isConfigured: false,
      isUp: null,
      publicAddress: null,
      country: null,
      checkedAt: null,
      problem: null,
    },
    indexers: { total: 0, enabled: 0, failing: [] },
  },
};

/**
 * The server, answering every question with the one body.
 */
const answering = (body: object, status = 200) => {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchRequestsAvailability', () => {
  it('reads whether requesting is on', async () => {
    answering({ isEnabled: true });

    await expect(fetchRequestsAvailability()).resolves.toEqual({ isEnabled: true });
  });
});

describe('fetchRequestsOverview', () => {
  it('reads what the server last heard from the service', async () => {
    answering(AN_OVERVIEW);

    await expect(fetchRequestsOverview()).resolves.toEqual({ ...AN_OVERVIEW, work: NO_WORK });
  });
});

describe('checkRequestsNow', () => {
  it('asks the server to check now, and reads what it heard', async () => {
    const fetchMock = answering(AN_OVERVIEW);

    await expect(checkRequestsNow()).resolves.toEqual({ ...AN_OVERVIEW, work: NO_WORK });
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/requests/check', {
      method: 'POST',
      credentials: 'same-origin',
    });
  });

  it('throws where the server refused', async () => {
    answering({ error: 'Requesting is off.' }, 404);

    await expect(checkRequestsNow()).rejects.toMatchObject({ status: 404 });
  });
});
