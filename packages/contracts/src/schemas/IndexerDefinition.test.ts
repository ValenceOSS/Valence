import { describe, expect, it } from 'vitest';
import { IndexerCatalogueSchema, IndexerDefinitionDetailSchema } from './IndexerDefinition';

const SUMMARY = {
  id: '1337x',
  name: '1337x',
  description: '1337x is a public torrent site',
  language: 'en-US',
  privacy: 'public',
  protocol: 'torrent',
  categories: ['Movies', 'TV'],
};

describe('IndexerDefinition', () => {
  it('reads a catalogue of definitions', () => {
    const catalogue = {
      definitions: [SUMMARY],
      updatedAt: '2026-09-19T00:00:00.000Z',
      source: 'Prowlarr/Indexers',
      problem: null,
    };

    expect(IndexerCatalogueSchema.parse(catalogue)).toEqual(catalogue);
  });

  it('reads one definition with the settings it asks for', () => {
    const detail = {
      ...SUMMARY,
      links: ['https://1337x.to/'],
      settings: [
        {
          name: 'sort',
          kind: 'select',
          label: 'Sort',
          detail: null,
          default: 'time',
          options: [{ value: 'time', label: 'Created' }],
          isSecret: false,
        },
        {
          name: 'password',
          kind: 'password',
          label: 'Password',
          detail: null,
          default: null,
          options: [],
          isSecret: true,
        },
      ],
      standardCategories: [{ id: 2000, name: 'Movies', subcategories: [] }],
      hasCaptcha: false,
      isBehindCloudflare: true,
    };

    expect(IndexerDefinitionDetailSchema.parse(detail)).toEqual(detail);
  });

  it('refuses a privacy it does not know', () => {
    expect(() => IndexerDefinitionDetailSchema.parse({ ...SUMMARY, privacy: 'secret' })).toThrow();
  });
});
