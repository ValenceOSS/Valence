import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { finishSetupFlow } from './finishSetupFlow';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('finishSetupFlow', () => {
  it('tells the server the steps are done', async () => {
    fetchMock.mockResolvedValue(Response.json({ isFlowOpen: false }));

    await expect(finishSetupFlow()).resolves.toBe(true);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/setup/finish');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBeUndefined();
  });

  it('says no when the server refuses', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'No.' }, { status: 403 }));

    await expect(finishSetupFlow()).resolves.toBe(false);
  });

  it('says no when the server answers with something else', async () => {
    fetchMock.mockResolvedValue(Response.json({ isFlowOpen: true }));

    await expect(finishSetupFlow()).resolves.toBe(false);
  });
});
