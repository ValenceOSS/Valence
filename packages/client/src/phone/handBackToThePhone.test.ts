import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handBackToThePhone } from './handBackToThePhone';

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const fetchMock = vi.fn<FetchLike>();

const CHALLENGE = 'a'.repeat(64);

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('handBackToThePhone', () => {
  it('sends the challenge the phone gave', async () => {
    fetchMock.mockResolvedValue(Response.json({ url: 'valence://signed-in?code=abc' }));

    await handBackToThePhone(CHALLENGE);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/phone/hand-back',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ challenge: CHALLENGE }) }),
    );
  });

  it('answers with where to send the browser', async () => {
    fetchMock.mockResolvedValue(Response.json({ url: 'valence://signed-in?code=abc' }));

    expect(await handBackToThePhone(CHALLENGE)).toBe('valence://signed-in?code=abc');
  });

  it('answers with nothing where the server refused', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'Nobody is signed in.' }, { status: 401 }));

    expect(await handBackToThePhone(CHALLENGE)).toBeNull();
  });

  it('answers with nothing where the server could not be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('offline'));

    expect(await handBackToThePhone(CHALLENGE)).toBeNull();
  });

  it('answers with nothing where the answer made no sense', async () => {
    fetchMock.mockResolvedValue(Response.json({ where: 'nowhere' }));

    expect(await handBackToThePhone(CHALLENGE)).toBeNull();
  });
});
