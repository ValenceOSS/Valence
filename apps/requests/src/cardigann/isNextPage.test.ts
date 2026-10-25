import { describe, expect, it } from 'vitest';
import { isNextPage } from './isNextPage';

describe('isNextPage', () => {
  it('takes the same search one page on for the next page', () => {
    expect(
      isNextPage(
        'https://mirror.general.example/sort-search/Show S01/time/desc/1/',
        'https://mirror.general.example/sort-search/Show S01/time/desc/2/',
      ),
    ).toBe(true);
    expect(
      isNextPage(
        'https://site.example/browse?q=dune&p=1',
        'https://site.example/browse?q=dune&p=2',
      ),
    ).toBe(true);
  });

  it('does not take a different search for the next page', () => {
    expect(
      isNextPage(
        'https://animetracker.example/?f=0&q=Show+03',
        'https://animetracker.example/?f=0&q=Show+3',
      ),
    ).toBe(false);
    expect(
      isNextPage('https://site.example/?q=dune&p=1', 'https://site.example/?q=arrival&p=2'),
    ).toBe(false);
    expect(isNextPage('https://site.example/?q=dune&p=1', 'https://site.example/?q=dune&p=3')).toBe(
      false,
    );
    expect(isNextPage('https://site.example/?q=dune&p=1', 'https://site.example/?q=dune&p=1')).toBe(
      false,
    );
  });
});
