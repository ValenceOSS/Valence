import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { revokeSetupLink } from './revokeSetupLink';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('revokeSetupLink', () => {
  it('stops the link working', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(revokeSetupLink('usr-1')).resolves.toBeNull();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/accounts/usr-1/setup-link');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('DELETE');
  });

  it('says the server could not be reached', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(revokeSetupLink('usr-1')).resolves.toEqual({
      message: 'Couldn’t reach the server.',
    });
  });
});
