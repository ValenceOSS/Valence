import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAccountList } from './fetchAccountList';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchAccountList', () => {
  it('reads the accounts and whether their links can be emailed', async () => {
    fetchMock.mockResolvedValue(Response.json({ accounts: [], canEmailSetupLinks: true }));

    await expect(fetchAccountList()).resolves.toEqual({ accounts: [], canEmailSetupLinks: true });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/accounts');
  });
});
