import { describe, expect, it } from 'vitest';
import { nameOfCatalogueShow } from './nameOfCatalogueShow';

describe('nameOfCatalogueShow', () => {
  it('names a show with the year it began, which tells a revival from the show it carries on', () => {
    expect(nameOfCatalogueShow({ title: 'A Show', year: 2026 })).toBe('A Show (2026)');
  });

  it('names a show the catalogue gives no year by its name alone', () => {
    expect(nameOfCatalogueShow({ title: 'A Show', year: null })).toBe('A Show');
  });
});
