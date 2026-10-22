import { afterEach, describe, expect, it, vi } from 'vitest';
import { isTheServerUp } from './isTheServerUp';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isTheServerUp', () => {
  it('says the server is up where its health check answers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true })),
    );

    expect(await isTheServerUp()).toBe(true);
  });

  it('says it is not where the check fails or nothing answers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: false })),
    );

    expect(await isTheServerUp()).toBe(false);

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );

    expect(await isTheServerUp()).toBe(false);
  });
});
