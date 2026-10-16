import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveBrandLogo } from './saveBrandLogo';

const BRAND = { name: null, accent: null, description: null, logo: '/api/brand/logo?v=a.png' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveBrandLogo', () => {
  it('uploads the picture as what it is', async () => {
    const fetch = vi.fn((_address: string, _init: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify({ brand: BRAND }))),
    );

    vi.stubGlobal('fetch', fetch);

    await expect(
      saveBrandLogo(new File(['x'], 'logo.png', { type: 'image/png' })),
    ).resolves.toEqual(BRAND);
    expect(fetch.mock.calls[0]?.[1].method).toBe('PUT');
  });

  it('takes it away where asked', async () => {
    const fetch = vi.fn((_address: string, _init: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify({ brand: { ...BRAND, logo: null } }))),
    );

    vi.stubGlobal('fetch', fetch);

    await saveBrandLogo(null);

    expect(fetch.mock.calls[0]?.[1].method).toBe('DELETE');
  });
});
