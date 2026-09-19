import { describe, expect, it } from 'vitest';
import {
  IndexerChangeSchema,
  IndexerDraftSchema,
  IndexerSchema,
  ReleaseSearchOutcomeSchema,
  ReleaseSearchSchema,
} from './Indexer';

describe('IndexerDraftSchema', () => {
  it('fills in what somebody adding an indexer need not decide', () => {
    expect(
      IndexerDraftSchema.parse({
        name: ' NZBgeek ',
        kind: 'newznab',
        url: 'https://api.nzbgeek.info',
      }),
    ).toEqual({
      name: 'NZBgeek',
      kind: 'newznab',
      url: 'https://api.nzbgeek.info',
      apiKey: '',
      priority: 25,
      isEnabled: true,
      categories: [],
      requestsPerMinute: null,
      timeoutSeconds: 30,
      definitionId: null,
      settings: {},
    });
  });

  it('refuses an address that is not one', () => {
    expect(() =>
      IndexerDraftSchema.parse({ name: 'Broken', kind: 'torznab', url: 'jackett' }),
    ).toThrow();
  });

  it('refuses a priority outside the range', () => {
    expect(() =>
      IndexerDraftSchema.parse({
        name: 'Too eager',
        kind: 'torznab',
        url: 'http://jackett:9117',
        priority: 0,
      }),
    ).toThrow();
  });
});

describe('IndexerChangeSchema', () => {
  it('takes any part of an indexer on its own', () => {
    expect(IndexerChangeSchema.parse({ isEnabled: false })).toEqual({ isEnabled: false });
  });
});

describe('IndexerSchema', () => {
  it('never carries the key itself, only whether there is one', () => {
    expect(Object.keys(IndexerSchema.shape)).not.toContain('apiKey');
    expect(Object.keys(IndexerSchema.shape)).toContain('hasApiKey');
  });
});

describe('ReleaseSearchSchema', () => {
  it('searches everything for nothing in particular by default', () => {
    expect(ReleaseSearchSchema.parse({})).toEqual({ query: '', mode: 'search' });
  });

  it('refuses an IMDb id that is not one', () => {
    expect(() => ReleaseSearchSchema.parse({ mode: 'movie', imdbId: '1375666' })).toThrow();
  });
});

describe('ReleaseSearchOutcomeSchema', () => {
  it('reads what every indexer found, and what each said', () => {
    const outcome = {
      releases: [
        {
          id: 'a',
          title: 'Inception.2010.1080p.BluRay',
          indexerId: '0f8fad5b-d9cb-469f-a165-70867728950e',
          indexerName: 'Jackett',
          protocol: 'torrent',
          sizeBytes: 8_000_000_000,
          seeders: 40,
          leechers: 3,
          grabs: null,
          publishedAt: '2026-09-01T00:00:00.000Z',
          categories: [2040],
          downloadUrl: 'http://jackett/dl/1',
          magnetUrl: null,
          infoUrl: null,
          infoHash: null,
        },
      ],
      indexers: [
        {
          indexerId: '0f8fad5b-d9cb-469f-a165-70867728950e',
          indexerName: 'Jackett',
          found: 1,
          tookMs: 420,
          problem: null,
        },
      ],
    };

    expect(ReleaseSearchOutcomeSchema.parse(outcome)).toEqual({
      ...outcome,
      releases: outcome.releases.map((release) => ({
        ...release,
        downloadFactor: null,
        uploadFactor: null,
        minimumRatio: null,
        minimumSeedSeconds: null,
      })),
    });
  });
});
