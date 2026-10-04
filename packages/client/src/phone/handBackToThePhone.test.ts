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

  it('names the port a desktop app is listening on, where it gave one', async () => {
    fetchMock.mockResolvedValue(
      Response.json({ url: 'http://127.0.0.1:51234/signed-in?code=abc' }),
    );

    await handBackToThePhone(CHALLENGE, 51_234);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/phone/hand-back',
      expect.objectContaining({ body: JSON.stringify({ challenge: CHALLENGE, port: 51_234 }) }),
    );
  });

  it('answers with where to send the browser', async () => {
    fetchMock.mockResolvedValue(Response.json({ url: 'valence://signed-in?code=abc' }));

    expect(await handBackToThePhone(CHALLENGE)).toBe('valence://signed-in?code=abc');
  });

  it('answers with nothing where the server refused', async () => {
    fetchMock.mockResolvedValue(Response.json({ error: 'You’re not signed in.' }, { status: 401 }));

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
