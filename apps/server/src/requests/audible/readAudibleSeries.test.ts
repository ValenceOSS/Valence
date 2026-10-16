import { describe, expect, it, vi } from 'vitest';
import { readAudibleSeries } from './readAudibleSeries';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicWeb } from '@ValenceServer/music/web/createMusicWeb';

const SERIES = {
  product: {
    title: 'A Series',
    relationships: [
      { asin: 'B0000000A1', relationship_to_product: 'child', sequence: '1' },
      { asin: 'B0000000A2', relationship_to_product: 'child', sequence: '1' },
      { asin: 'B0000000B1', relationship_to_product: 'child', sequence: '2' },
      { asin: 'B0000000C1', relationship_to_product: 'child', sequence: '1.5' },
      { asin: 'B0000000D1', relationship_to_product: 'child', sequence: '3' },
      { asin: 'B0000000E1', relationship_to_product: 'child', sequence: '4' },
      { asin: 'B0000000E2', relationship_to_product: 'child', sequence: '4' },
      { asin: 'B0000000F1', relationship_to_product: 'child', sequence: '5' },
      { asin: 'B0000000P0', relationship_to_product: 'parent', sequence: '' },
    ],
  },
};

const product = (
  asin: string,
  title: string,
  narrators: string[],
  extra: Record<string, string> = {},
) => ({
  asin,
  title,
  authors: [{ name: 'An Author' }],
  narrators: narrators.map((name) => ({ name })),
  runtime_length_min: 600,
  format_type: 'unabridged',
  language: 'english',
  release_date: '2020-05-01',
  ...extra,
});

/**
 * Audible's catalogue, answering for the series and then its books.
 */
const aWeb = () => {
  const json = vi.fn((url: string): Promise<JsonValue | null> =>
    Promise.resolve(
      url.includes('?asins=') || url.includes('&asins=') || url.includes('asins=')
        ? {
            products: [
              product('B0000000A1', 'First', ['Ann', 'Bob']),
              product('B0000000A2', 'First', ['Bob', 'Ann']),
              product('B0000000B1', 'Second', ['Ann']),
              product('B0000000C1', 'Between', ['Ann']),
              product('B0000000D1', 'Third', ['Ann'], { format_type: 'abridged' }),
              product('B0000000E1', 'Fourth (Dramatized Adaptation)', ['A Full Cast'], {
                content_type: 'Performance',
              }),
              product('B0000000E2', 'Fourth', ['Ann']),
              product('B0000000F1', 'Fifth [Dramatized Adaptation]', ['A Full Cast']),
            ],
          }
        : SERIES,
    ),
  );

  return { json, bytes: vi.fn(), text: vi.fn() } satisfies MusicWeb;
};

describe('readAudibleSeries', () => {
  it('lists the books in order, companions marked, each edition read by the same people once', async () => {
    const found = await readAudibleSeries(aWeb(), 'B0SERIES00');

    expect(found?.title).toBe('A Series');
    expect(found?.books.map((book) => [book.position, book.title, book.isCompanion])).toEqual([
      ['1', 'First', false],
      ['1.5', 'Between', true],
      ['2', 'Second', false],
      ['4', 'Fourth', false],
      ['5', 'Fifth', false],
    ]);
    expect(found?.books[0]).toMatchObject({
      asin: 'B0000000A1',
      author: 'An Author',
      year: 2020,
      openLibraryId: null,
      narrations: [
        {
          asin: 'B0000000A1',
          narrators: ['Ann', 'Bob'],
          runtimeMinutes: 600,
          series: 'A Series',
          seriesAsin: 'B0SERIES00',
          seriesPosition: '1',
        },
      ],
    });
  });

  it('never takes a full-cast adaptation for a narration, nor its title for the book’s', async () => {
    const found = await readAudibleSeries(aWeb(), 'B0SERIES00');

    expect(
      found?.books.slice(-2).map((book) => ({
        asin: book.asin,
        title: book.title,
        narrations: book.narrations.map((narration) => narration.asin),
      })),
    ).toEqual([
      { asin: 'B0000000E2', title: 'Fourth', narrations: ['B0000000E2'] },
      { asin: 'B0000000F1', title: 'Fifth', narrations: [] },
    ]);
  });

  it('knows nothing of a series Audible does not answer for', async () => {
    const web = { json: vi.fn(() => Promise.resolve(null)), bytes: vi.fn(), text: vi.fn() };

    expect(await readAudibleSeries(web, 'B0SERIES00')).toBeNull();
  });
});
