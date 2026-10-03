import { describe, expect, it } from 'vitest';
import { A_NEW_INDEXER } from './readIndexerForm';
import type { IndexerForm } from './readIndexerForm';
import { indexerFormSchema } from './indexerFormSchema';

const FILLED = {
  ...A_NEW_INDEXER,
  name: ' Jackett ',
  url: ' http://jackett:9117/ ',
  apiKey: ' key ',
};

const read = (form: IndexerForm, fallbackUrl = '') => {
  const parsed = indexerFormSchema(fallbackUrl, {}).safeParse(form);

  return parsed.success
    ? { draft: parsed.data, problem: null }
    : { draft: null, problem: parsed.error.issues[0]?.message ?? null };
};

describe('indexerFormSchema', () => {
  it('sends a site’s definition and settings, and a generic indexer neither', () => {
    const site = read({
      ...FILLED,
      kind: 'cardigann',
      definitionId: '1337x',
      settings: { sort: 'size' },
    });

    expect(site.draft).toMatchObject({ definitionId: '1337x', settings: { sort: 'size' } });
    expect(read({ ...FILLED, definitionId: 'x', settings: { a: 'b' } }).draft).toMatchObject({
      definitionId: null,
      settings: {},
    });
  });

  it('reads what an operator asked of a torrent once it is filed', () => {
    expect(
      read({ ...FILLED, removesWhenDone: 'always', seedSeconds: '3600', seedRatio: '2' }).draft,
    ).toMatchObject({ removesWhenDone: true, seedSeconds: 3600, seedRatio: 2 });
    expect(read({ ...FILLED, removesWhenDone: 'never' }).draft?.removesWhenDone).toBe(false);
    expect(read({ ...FILLED, removesWhenDone: 'tracker' }).draft?.removesWhenDone).toBe(null);
  });

  it('says what is wrong with a seed time or a ratio it cannot read', () => {
    expect(read({ ...FILLED, seedSeconds: 'ages' }).problem).toBe(
      'Enter a seed time as a whole number of seconds, up to one year.',
    );
    expect(read({ ...FILLED, seedRatio: 'lots' }).problem).toBe('Enter a ratio from 0 to 1000.');
    expect(read({ ...FILLED, seedRatio: '-1' }).problem).toBe('Enter a ratio from 0 to 1000.');
  });

  it('reads a filled form, trimming what was typed', () => {
    expect(read(FILLED)).toEqual({
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
    expect(read({ ...FILLED, requestsPerMinute: '30' }).draft?.requestsPerMinute).toBe(30);
  });

  it.each([
    [{ name: '  ' }, 'Give the indexer a name.'],
    [{ url: 'jackett' }, 'Enter a full http or https address.'],
    [{ url: 'ftp://jackett/' }, 'Enter a full http or https address.'],
    [{ priority: '0' }, 'Priority must be a whole number from 1 to 50.'],
    [{ priority: 'high' }, 'Priority must be a whole number from 1 to 50.'],
    [
      { requestsPerMinute: '2.5' },
      'Enter a limit as a whole number of searches per minute, up to 600.',
    ],
    [{ timeoutSeconds: '300' }, 'Enter a timeout between 5 and 120 seconds.'],
    [{ timeoutSeconds: '' }, 'Enter a timeout between 5 and 120 seconds.'],
  ])('says what is wrong with %o', (change, problem) => {
    expect(read({ ...FILLED, ...change })).toEqual({ draft: null, problem });
  });

  it('takes the site’s own address where none was typed', () => {
    expect(read({ ...FILLED, url: '' }, 'https://1337x.to/').draft?.url).toBe('https://1337x.to/');
  });

  it('fills in a site’s own setting defaults beneath what was chosen', () => {
    const parsed = indexerFormSchema('', { sort: 'date', order: 'desc' }).safeParse({
      ...FILLED,
      kind: 'cardigann',
      definitionId: '1337x',
      settings: { sort: 'size' },
    });

    expect(parsed.data?.settings).toEqual({ sort: 'size', order: 'desc' });
  });
});
