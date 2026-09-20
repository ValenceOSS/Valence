import { describe, expect, it } from 'vitest';
import { filterCatalogue } from './filterCatalogue';
import type { IndexerDefinitionSummary } from '@ValenceContracts/schemas/IndexerDefinition';

/**
 * A definition, with anything the test cares about changed.
 */
const aSite = (overrides: Partial<IndexerDefinitionSummary>): IndexerDefinitionSummary => ({
  id: 'x',
  name: 'X',
  description: '',
  language: 'en-US',
  privacy: 'public',
  protocol: 'torrent',
  categories: ['Movies'],
  ...overrides,
});

const CATALOGUE = [
  aSite({
    id: '1337x',
    name: '1337x',
    description: 'A public torrent site',
    categories: ['Movies', 'TV'],
  }),
  aSite({
    id: 'rutor',
    name: 'RuTor',
    description: 'A Russian public tracker',
    language: 'ru-RU',
    categories: ['TV'],
  }),
  aSite({ id: 'hdb', name: 'HDBits', description: 'A private tracker for HD', privacy: 'private' }),
];

const NOTHING = { words: '', privacy: 'any' as const, category: '', language: '' };

describe('filterCatalogue', () => {
  it('leaves everything with nothing chosen', () => {
    expect(filterCatalogue(CATALOGUE, NOTHING)).toHaveLength(3);
  });

  it('finds every word typed, in the name or the description', () => {
    expect(
      filterCatalogue(CATALOGUE, { ...NOTHING, words: 'PUBLIC tracker' }).map((site) => site.id),
    ).toEqual(['rutor']);
    expect(
      filterCatalogue(CATALOGUE, { ...NOTHING, words: '1337' }).map((site) => site.id),
    ).toEqual(['1337x']);
  });

  it('narrows by privacy, category and language', () => {
    expect(
      filterCatalogue(CATALOGUE, { ...NOTHING, privacy: 'private' }).map((site) => site.id),
    ).toEqual(['hdb']);
    expect(
      filterCatalogue(CATALOGUE, { ...NOTHING, category: 'TV' }).map((site) => site.id),
    ).toEqual(['1337x', 'rutor']);
    expect(
      filterCatalogue(CATALOGUE, { ...NOTHING, language: 'ru-RU' }).map((site) => site.id),
    ).toEqual(['rutor']);
  });
});
