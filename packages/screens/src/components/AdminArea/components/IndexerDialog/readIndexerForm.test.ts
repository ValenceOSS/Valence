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
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

describe('formFor', () => {
  it('opens empty for a new indexer', () => {
    expect(formFor(null)).toEqual(A_NEW_INDEXER);
  });

  it('opens on a kept indexer without its key', () => {
    expect(formFor(KEPT)).toEqual({
      kind: 'newznab',
      name: 'NZBgeek',
      url: 'https://api.nzbgeek.info',
      apiKey: '',
      priority: '5',
      requestsPerMinute: '10',
      timeoutSeconds: '60',
      isEnabled: false,
      categories: [2000],
    });
  });

  it('leaves the limit empty for an indexer with none', () => {
    expect(formFor({ ...KEPT, requestsPerMinute: null }).requestsPerMinute).toBe('');
  });
});

describe('readIndexerForm', () => {
  it('reads a filled form, trimming what was typed', () => {
    expect(readIndexerForm(FILLED)).toEqual({
      draft: {
        kind: 'torznab',
        name: 'Jackett',
        url: 'http://jackett:9117/',
        apiKey: 'key',
        priority: 25,
        requestsPerMinute: null,
        timeoutSeconds: 30,
        isEnabled: true,
        categories: [],
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
