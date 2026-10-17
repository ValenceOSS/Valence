import { describe, expect, it } from 'vitest';
import { isNextPage } from './isNextPage';

describe('isNextPage', () => {
  it('takes the same search one page on for the next page', () => {
    expect(
      isNextPage(
        'https://x1337x.eu/sort-search/Haruhi S01/time/desc/1/',
        'https://x1337x.eu/sort-search/Haruhi S01/time/desc/2/',
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
      isNextPage('https://nyaa.si/?f=0&q=Frieren+03', 'https://nyaa.si/?f=0&q=Frieren+3'),
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
