import { describe, expect, it } from 'vitest';
import { A_NEW_INDEXER, formFor } from './readIndexerForm';
import type { Indexer } from '@ValenceContracts/schemas/Indexer';

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
  lastProblemCode: null,
  lastFailedAt: null,
  turnedOffBecause: null,
  sourceAppId: null,
  sourceIndexerId: null,
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
