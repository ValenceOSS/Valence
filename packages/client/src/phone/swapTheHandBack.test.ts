import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { swapTheHandBack } from './swapTheHandBack';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const fetchMock = vi.fn<FetchLike>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('swapTheHandBack', () => {
  it('sends the code with the secret it was made against', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await swapTheHandBack('abc', 'the-secret');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/phone/exchange',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ code: 'abc', secret: 'the-secret' }),
      }),
    );
  });

  it('says the phone is signed in where the server took them', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    expect(await swapTheHandBack('abc', 'the-secret')).toBe(true);
  });

  it('says it is not where the server refused them', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));

    expect(await swapTheHandBack('abc', 'the-secret')).toBe(false);
  });

  it('says it is not where the server could not be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('offline'));

    expect(await swapTheHandBack('abc', 'the-secret')).toBe(false);
  });
});
