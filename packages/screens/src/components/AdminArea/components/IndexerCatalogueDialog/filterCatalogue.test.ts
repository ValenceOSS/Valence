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
    id: 'opensite',
    name: 'OpenSite',
    description: 'A public torrent site',
    categories: ['Movies', 'TV'],
  }),
  aSite({
    id: 'rusite',
    name: 'RuSite',
    description: 'A Russian public tracker',
    language: 'ru-RU',
    categories: ['TV'],
  }),
  aSite({
    id: 'hdb',
    name: 'PrivateHD',
    description: 'A private tracker for HD',
    privacy: 'private',
  }),
];

const NOTHING = { words: '', privacy: 'any' as const, category: '', language: '' };

describe('filterCatalogue', () => {
  it('leaves everything with nothing chosen', () => {
    expect(filterCatalogue(CATALOGUE, NOTHING)).toHaveLength(3);
  });

  it('finds every word typed, in the name or the description', () => {
    expect(
      filterCatalogue(CATALOGUE, { ...NOTHING, words: 'PUBLIC tracker' }).map((site) => site.id),
    ).toEqual(['rusite']);
    expect(
      filterCatalogue(CATALOGUE, { ...NOTHING, words: 'open' }).map((site) => site.id),
    ).toEqual(['opensite']);
  });

  it('narrows by privacy, category and language', () => {
    expect(
      filterCatalogue(CATALOGUE, { ...NOTHING, privacy: 'private' }).map((site) => site.id),
    ).toEqual(['hdb']);
    expect(
      filterCatalogue(CATALOGUE, { ...NOTHING, category: 'TV' }).map((site) => site.id),
    ).toEqual(['opensite', 'rusite']);
    expect(
      filterCatalogue(CATALOGUE, { ...NOTHING, language: 'ru-RU' }).map((site) => site.id),
    ).toEqual(['rusite']);
  });
});
