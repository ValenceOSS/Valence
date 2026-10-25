import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setDismissed } from './setDismissed';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<{ ok: boolean }>>();

const ID = '9c858901-8a57-4791-81fe-4c455b099bc9';

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('setDismissed', () => {
  it('takes it off with a put and puts it back with a delete', async () => {
    fetchMock.mockResolvedValue({ ok: true });

    await expect(setDismissed(ID, true)).resolves.toBe(true);
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe(`/api/media/${ID}/dismissed`);
    expect(fetchMock.mock.calls.at(-1)?.[1]?.method).toBe('PUT');

    await setDismissed(ID, false);
    expect(fetchMock.mock.calls.at(-1)?.[1]?.method).toBe('DELETE');
  });

  it('reports a refusal rather than throwing', async () => {
    fetchMock.mockResolvedValue({ ok: false });

    await expect(setDismissed(ID, true)).resolves.toBe(false);
  });

  it('reports a server it could not reach rather than throwing', async () => {
    fetchMock.mockRejectedValue(new TypeError('offline'));

    await expect(setDismissed(ID, true)).resolves.toBe(false);
  });
});
