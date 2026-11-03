import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchDevImage } from './fetchDevImage';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchDevImage', () => {
  it('signs in as nobody, then asks for what the dev tag points at with that token', async () => {
    const asked = vi.fn((url: string, _init?: RequestInit) =>
      Promise.resolve(
        new Response(JSON.stringify(url.includes('/token') ? { token: 'anonymous' } : {})),
      ),
    );

    vi.stubGlobal('fetch', asked);

    await fetchDevImage(AbortSignal.timeout(1000));

    const [url, init] = asked.mock.lastCall ?? [];

    expect(url).toBe('https://ghcr.io/v2/valenceoss/valence/manifests/dev');
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer anonymous');
  });

  it('hands back the refusal where no token was given', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('', { status: 503 }))),
    );

    expect((await fetchDevImage(AbortSignal.timeout(1000))).status).toBe(503);
  });
});
