import { afterEach, describe, expect, it, vi } from 'vitest';
import { saveWordRules } from './saveWordRules';

const RULE = { field: 'genres' as const, find: 'Sci-Fi', replace: 'Science Fiction' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saveWordRules', () => {
  it('puts every rule of the library', async () => {
    const fetching = vi.fn((_url: string, _init?: RequestInit) =>
      Promise.resolve(new Response(JSON.stringify({ rules: [RULE] }), { status: 200 })),
    );

    vi.stubGlobal('fetch', fetching);

    await expect(saveWordRules('lib', [RULE])).resolves.toBeNull();
    expect(fetching.mock.calls[0]?.[0]).toBe('/api/libraries/lib/word-rules');
    expect(fetching.mock.calls[0]?.[1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ rules: [RULE] }),
    });
  });
});
