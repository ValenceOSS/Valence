import { describe, expect, it } from 'vitest';
import { A_NEW_INDEXER, formFor, readIndexerForm } from './readIndexerForm';
import type { Indexer } from '@ValenceContracts/schemas/Indexer';

const FILLED = {
  ...A_NEW_INDEXER,
  name: ' Jackett ',
  url: ' http://jackett:9117/ ',
  apiKey: ' key ',
};

const KEPT: Indexer = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'NZBgeek',
  kind: 'newznab',
  url: 'https://api.nzbgeek.info',
  hasApiKey: true,
  definitionId: null,
  settings: {},
  secretsSet: [],
  privacy: null,
  priority: 5,
  isEnabled: false,
  categories: [2000],
  requestsPerMinute: 10,
  timeoutSeconds: 60,
  capabilities: null,
  failures: 0,
  lastProblem: null,
  lastFailedAt: null,
  turnedOffBecause: null,
  removesWhenDone: null,
  seedSeconds: null,
  seedRatio: null,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

describe('formFor', () => {
  it('opens empty for a new indexer', () => {
    expect(formFor(null)).toEqual(A_NEW_INDEXER);
  });

  it('opens on what the tracker expects, where nobody has said otherwise', () => {
    expect(formFor(KEPT)).toMatchObject({
      removesWhenDone: 'tracker',
      seedSeconds: '',
      seedRatio: '',
    });
    expect(formFor({ ...KEPT, removesWhenDone: true, seedSeconds: 3600 })).toMatchObject({
      removesWhenDone: 'always',
      seedSeconds: '3600',
    });
    expect(formFor({ ...KEPT, removesWhenDone: false })).toMatchObject({
      removesWhenDone: 'never',
    });
  });

  it('opens on a kept indexer without its key', () => {
    expect(formFor(KEPT)).toEqual({
      kind: 'newznab',
      name: 'NZBgeek',
      url: 'https://api.nzbgeek.info',
      apiKey: '',
      priority: '5',
      removesWhenDone: 'tracker',
      seedSeconds: '',
      seedRatio: '',
      requestsPerMinute: '10',
      timeoutSeconds: '60',
      isEnabled: false,
      categories: [2000],
      definitionId: null,
      settings: {},
    });
  });

  it('leaves the limit empty for an indexer with none', () => {
    expect(formFor({ ...KEPT, requestsPerMinute: null }).requestsPerMinute).toBe('');
  });
});

describe('formFor, adding', () => {
  it('opens on a site chosen from the catalogue with its name', () => {
    expect(
      formFor(null, { kind: 'cardigann', definitionId: '1337x', name: '1337x' }),
    ).toMatchObject({
      kind: 'cardigann',
      name: '1337x',
      definitionId: '1337x',
      url: '',
    });
  });

  it('opens on a generic kind chosen from the catalogue', () => {
    expect(formFor(null, { kind: 'newznab' }).kind).toBe('newznab');
  });
});

describe('readIndexerForm', () => {
  it('sends a site’s definition and settings, and a generic indexer neither', () => {
    const site = readIndexerForm({
      ...FILLED,
      kind: 'cardigann',
      definitionId: '1337x',
      settings: { sort: 'size' },
    });

    expect(site.draft).toMatchObject({ definitionId: '1337x', settings: { sort: 'size' } });
    expect(
      readIndexerForm({ ...FILLED, definitionId: 'x', settings: { a: 'b' } }).draft,
    ).toMatchObject({
      definitionId: null,
      settings: {},
    });
  });

  it('reads what an operator asked of a torrent once it is filed', () => {
    expect(
      readIndexerForm({ ...FILLED, removesWhenDone: 'always', seedSeconds: '3600', seedRatio: '2' })
        .draft,
    ).toMatchObject({ removesWhenDone: true, seedSeconds: 3600, seedRatio: 2 });
    expect(readIndexerForm({ ...FILLED, removesWhenDone: 'never' }).draft?.removesWhenDone).toBe(
      false,
    );
    expect(readIndexerForm({ ...FILLED, removesWhenDone: 'tracker' }).draft?.removesWhenDone).toBe(
      null,
    );
  });

  it('says what is wrong with a seed time or a ratio it cannot read', () => {
    expect(readIndexerForm({ ...FILLED, seedSeconds: 'ages' }).problem).toBe(
      'Seed for a whole number of minutes, up to a year.',
    );
    expect(readIndexerForm({ ...FILLED, seedRatio: 'lots' }).problem).toBe(
      'A ratio is a number from 0 to 1000.',
    );
    expect(readIndexerForm({ ...FILLED, seedRatio: '-1' }).problem).toBe(
      'A ratio is a number from 0 to 1000.',
    );
  });

  it('reads a filled form, trimming what was typed', () => {
    expect(readIndexerForm(FILLED)).toEqual({
      draft: {
        kind: 'torznab',
        name: 'Jackett',
        url: 'http://jackett:9117/',
        apiKey: 'key',
        priority: 25,
        removesWhenDone: null,
        seedSeconds: null,
        seedRatio: null,
        requestsPerMinute: null,
        timeoutSeconds: 30,
        isEnabled: true,
        categories: [],
        definitionId: null,
        settings: {},
      },
      problem: null,
    });
  });

  it('reads a limit where one is given', () => {
    expect(readIndexerForm({ ...FILLED, requestsPerMinute: '30' }).draft?.requestsPerMinute).toBe(
      30,
    );
  });

  it.each([
    [{ name: '  ' }, 'Give the indexer a name.'],
    [{ url: 'jackett' }, 'The address needs to be a whole http or https address.'],
    [{ url: 'ftp://jackett/' }, 'The address needs to be a whole http or https address.'],
    [{ priority: '0' }, 'Priority is a whole number from 1 to 50.'],
    [{ priority: 'high' }, 'Priority is a whole number from 1 to 50.'],
    [{ requestsPerMinute: '2.5' }, 'The limit is a whole number of searches a minute, up to 600.'],
    [{ timeoutSeconds: '300' }, 'Wait between 5 and 120 seconds for an answer.'],
    [{ timeoutSeconds: '' }, 'Wait between 5 and 120 seconds for an answer.'],
  ])('says what is wrong with %o', (change, problem) => {
    expect(readIndexerForm({ ...FILLED, ...change })).toEqual({ draft: null, problem });
  });
});
