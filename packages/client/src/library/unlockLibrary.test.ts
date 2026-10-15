import { afterEach, describe, expect, it, vi } from 'vitest';
import { unlockLibrary } from './unlockLibrary';

const answering = (status: number, body: object) =>
  vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('unlockLibrary', () => {
  it('says until when a library is open', async () => {
    vi.stubGlobal('fetch', answering(200, { untilMs: 2000 }));

    await expect(unlockLibrary('kids', '2468')).resolves.toEqual({
      kind: 'unlocked',
      untilMs: 2000,
    });
  });

  it('says the secret was wrong, or tried too often', async () => {
    vi.stubGlobal('fetch', answering(403, {}));

    await expect(unlockLibrary('kids', '0000')).resolves.toEqual({ kind: 'wrong' });

    vi.stubGlobal('fetch', answering(429, {}));

    await expect(unlockLibrary('kids', '0000')).resolves.toEqual({ kind: 'tooMany' });
  });
});
