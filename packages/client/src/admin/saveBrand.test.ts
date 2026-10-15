import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveBrand } from './saveBrand';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveBrand', () => {
  it('sends the brand and reads back where it now stands', async () => {
    const brand = { name: 'Home Cinema', accent: '#ff6600', description: null };
    const fetch = vi.fn((_address: string, _init: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify({ brand: { ...brand, logo: null } }))),
    );

    vi.stubGlobal('fetch', fetch);

    await expect(saveBrand(brand)).resolves.toEqual({ ...brand, logo: null });
    expect(fetch.mock.calls[0]?.[1].body).toBe(JSON.stringify(brand));
  });

  it('answers nothing where it could not be saved', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}', { status: 400 }))),
    );

    await expect(saveBrand({ name: null, accent: null, description: null })).resolves.toBeNull();
  });
});
