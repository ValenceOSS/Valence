import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWordRules } from './fetchWordRules';

const RULE = { field: 'genres' as const, find: 'Sci-Fi', replace: 'Science Fiction' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchWordRules', () => {
  it('reads the library’s rules', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ rules: [RULE] }) }),
      ),
    );

    await expect(fetchWordRules('lib')).resolves.toEqual([RULE]);
  });
});
