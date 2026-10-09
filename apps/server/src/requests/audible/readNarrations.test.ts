import { describe, expect, it, vi } from 'vitest';
import { readNarrations } from './readNarrations';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

const PRODUCTS = {
  products: [
    {
      asin: 'A',
      title: 'A Book: A Novel',
      authors: [{ name: 'An Author' }],
      format_type: 'unabridged',
    },
    { asin: 'B', title: 'A Book', authors: [{ name: 'An Author' }], format_type: 'unabridged' },
    { asin: 'C', title: 'A Book', authors: [{ name: 'An Author' }], format_type: 'abridged' },
    {
      asin: 'D',
      title: 'Another Book',
      authors: [{ name: 'An Author' }],
      format_type: 'unabridged',
    },
    { asin: 'E', title: 'A Book', authors: [{ name: 'Somebody Else' }], format_type: 'unabridged' },
    { asin: 'F', title: 'A Book', authors: [{ name: 'An Author' }], format_type: 'unabridged' },
  ],
};

const BOOKS: Readonly<Record<string, JsonValue>> = {
  A: {
    asin: 'A',
    formatType: 'unabridged',
    runtimeLengthMin: 732,
    narrators: [{ name: 'Ann Reader' }],
    seriesPrimary: { name: 'A Series' },
  },
  B: {
    asin: 'B',
    formatType: 'unabridged',
    runtimeLengthMin: 700,
    narrators: [{ name: 'Bob Voice' }],
  },
  F: {
    asin: 'F',
    formatType: 'unabridged',
    runtimeLengthMin: 731,
    narrators: [{ name: 'Ann Reader' }],
  },
};

/**
 * Audible's catalogue and Audnexus, answering from the tables above.
 */
const aWeb = () => {
  const json = vi.fn((url: string): Promise<JsonValue | null> =>
    Promise.resolve(
      url.startsWith('https://api.audible.com/')
        ? PRODUCTS
        : (BOOKS[url.slice(url.lastIndexOf('/') + 1)] ?? null),
    ),
  );

  return { json, bytes: vi.fn(), text: vi.fn() } satisfies MusicWeb;
};

describe('readNarrations', () => {
  it('lists each unabridged narration of the book by its author, once a narrator', async () => {
    const web = aWeb();

    expect(await readNarrations(web, 'A Book', 'An Author')).toEqual([
      { asin: 'A', narrators: ['Ann Reader'], runtimeMinutes: 732, series: 'A Series' },
      { asin: 'B', narrators: ['Bob Voice'], runtimeMinutes: 700, series: null },
    ]);
    expect(web.json.mock.calls[0]?.[0]).toContain('title=A+Book&author=An+Author');
  });

  it('lists nothing where Audible does not answer', async () => {
    const web = { json: vi.fn(() => Promise.resolve(null)), bytes: vi.fn(), text: vi.fn() };

    expect(await readNarrations(web, 'A Book', null)).toEqual([]);
  });
});
