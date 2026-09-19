import { describe, expect, it } from 'vitest';
import { configVariables } from './configVariables';
import type { CardigannDefinition } from './CardigannDefinitionSchema';

const NOW = Date.parse('2026-09-19T12:00:00.000Z');

/**
 * A definition with the settings given.
 */
const aDefinition = (settings: CardigannDefinition['settings']): CardigannDefinition => ({
  id: 'x',
  name: 'X',
  description: '',
  type: 'private',
  language: 'en-US',
  encoding: 'UTF-8',
  links: ['https://x.example/'],
  legacylinks: [],
  followredirect: false,
  testlinktorrent: true,
  settings,
  caps: { modes: { search: ['q'] }, allowrawsearch: false },
  search: {
    headers: {},
    keywordsfilters: [],
    allowEmptyInputs: false,
    inputs: {},
    preprocessingfilters: [],
    rows: {
      selector: 'tr',
      optional: false,
      filters: [],
      after: 0,
      multiple: false,
      missingAttributeEqualsNoResults: false,
    },
    fields: [],
  },
});

const SETTINGS: CardigannDefinition['settings'] = [
  { name: 'username', type: 'text', label: 'Username' },
  { name: 'apikey', type: 'password', label: 'Key' },
  { name: 'freeleech', type: 'checkbox', label: 'Free only', default: 'false' },
  { name: 'nuked', type: 'checkbox', label: 'Show nuked', default: 'true' },
  {
    name: 'sort',
    type: 'select',
    label: 'Sort',
    default: 'added',
    options: { added: 'Added', size: 'Size' },
  },
  {
    name: 'order',
    type: 'select',
    label: 'Order',
    options: { desc: 'Descending', asc: 'Ascending' },
  },
  {
    name: 'quality',
    type: 'multi-select',
    label: 'Quality',
    defaults: ['1080p'],
    options: { '720p': '720p', '1080p': '1080p' },
  },
  { name: 'info', type: 'info', label: 'About', default: 'Read me' },
];

describe('configVariables', () => {
  it('gives the special variables', () => {
    expect(configVariables(aDefinition([]), {}, 'https://x.example/', NOW)).toEqual({
      '.Config.sitelink': 'https://x.example/',
      '.True': 'True',
      '.False': null,
      '.Today.Year': '2026',
    });
  });

  it('reads what was saved, as each kind of setting means it', () => {
    expect(
      configVariables(
        aDefinition(SETTINGS),
        {
          username: 'ada',
          apikey: 'k',
          freeleech: true,
          nuked: false,
          sort: 'size',
          order: 'asc',
          quality: '720p,1080p',
        },
        'https://x.example/',
        NOW,
      ),
    ).toMatchObject({
      '.Config.username': 'ada',
      '.Config.apikey': 'k',
      '.Config.freeleech': 'True',
      '.Config.nuked': null,
      '.Config.sort': 'size',
      '.Config.order': 'asc',
      '.Config.quality': ['720p', '1080p'],
    });
  });

  it('falls back to the defaults where nothing was saved, and says nothing for info', () => {
    const variables = configVariables(aDefinition(SETTINGS), {}, 'https://x.example/', NOW);

    expect(variables).toMatchObject({
      '.Config.username': '',
      '.Config.freeleech': null,
      '.Config.nuked': 'True',
      '.Config.sort': 'added',
      '.Config.order': 'desc',
      '.Config.quality': ['1080p'],
    });
    expect(variables).not.toHaveProperty('.Config.info');
  });

  it('reads a ticked box saved as text, and ignores an option that does not exist', () => {
    expect(
      configVariables(
        aDefinition(SETTINGS),
        { freeleech: 'true', sort: 'nonsense' },
        'https://x.example/',
        NOW,
      ),
    ).toMatchObject({ '.Config.freeleech': 'True', '.Config.sort': 'added' });
  });

  it('asks for a username and password where the definition names no settings', () => {
    expect(
      configVariables(aDefinition(null), { username: 'ada' }, 'https://x.example/', NOW),
    ).toMatchObject({
      '.Config.username': 'ada',
      '.Config.password': '',
    });
  });

  it('reads a select with no options as unset', () => {
    expect(
      configVariables(
        aDefinition([{ name: 'empty', type: 'select', label: 'Empty' }]),
        {},
        'https://x.example/',
        NOW,
      ),
    ).toMatchObject({ '.Config.empty': null });
  });
});
