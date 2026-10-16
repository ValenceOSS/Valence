import { describe, expect, it } from 'vitest';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { rankBySearch } from './rankBySearch';

describe('rankBySearch', () => {
  it('puts a show named exactly what was typed before films that only mention it', () => {
    const films = [
      aMediaSummary({ id: 'a', title: 'A Film About a Reacher' }),
      aMediaSummary({ id: 'b', title: 'Big Night' }),
    ];
    const shows = [aMediaSummary({ id: 'c', title: 'Pilot', seriesTitle: 'Reacher' })];

    expect(rankBySearch([...films, ...shows], 'reacher').map((item) => item.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('keeps the order each library gave titles that answer equally well', () => {
    const found = [
      aMediaSummary({ id: 'first', title: 'Nothing like it' }),
      aMediaSummary({ id: 'second', title: 'Still nothing' }),
    ];

    expect(rankBySearch(found, 'reacher').map((item) => item.id)).toEqual(['first', 'second']);
  });
});
