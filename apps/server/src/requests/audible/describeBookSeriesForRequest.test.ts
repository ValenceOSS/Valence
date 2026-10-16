import { describe, expect, it, vi } from 'vitest';
import { describeBookSeriesForRequest } from './describeBookSeriesForRequest';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

/**
 * Audible's catalogue and Open Library's search, answering for a series of two books.
 */
const aWeb = () => {
  const json = vi.fn((url: string): Promise<JsonValue | null> => {
    if (url.startsWith('https://openlibrary.org/')) {
      return Promise.resolve(
        url.includes('First')
          ? { docs: [{ key: '/works/OL11W', title: 'First: A Novel', author_name: ['An Author'] }] }
          : { docs: [] },
      );
    }

    return Promise.resolve(
      url.includes('asins=')
        ? {
            products: ['First', 'Second'].map((title, at) => ({
              asin: `B00000000${at.toString()}`,
              title,
              authors: [{ name: 'An Author' }],
              narrators: [{ name: 'Ann' }],
              runtime_length_min: 600,
              format_type: 'unabridged',
              language: 'english',
              release_date: `${(2020 + at).toString()}-01-01`,
            })),
          }
        : {
            product: {
              title: 'A Series',
              relationships: [
                { asin: 'B000000000', relationship_to_product: 'child', sequence: '1' },
                { asin: 'B000000001', relationship_to_product: 'child', sequence: '2' },
              ],
            },
          },
    );
  });

  return { json, bytes: vi.fn(), text: vi.fn() } satisfies MusicWeb;
};

describe('describeBookSeriesForRequest', () => {
  it('describes the series, each book found on Open Library where it is known', async () => {
    const found = await describeBookSeriesForRequest(aWeb(), 'B0SERIES00');

    expect(found).toMatchObject({ title: 'A Series', artist: 'An Author', year: 2020 });
    expect(found?.books?.map((book) => [book.title, book.openLibraryId])).toEqual([
      ['First', 11],
      ['Second', null],
    ]);
  });

  it('knows nothing of a series Audible does not answer for', async () => {
    const web = { json: vi.fn(() => Promise.resolve(null)), bytes: vi.fn(), text: vi.fn() };

    expect(await describeBookSeriesForRequest(web, 'B0SERIES00')).toBeNull();
  });
});
