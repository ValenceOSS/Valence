import { describe, expect, it } from 'vitest';
import { indexerEndpoint } from './indexerEndpoint';

describe('indexerEndpoint', () => {
  it('asks a Newznab site at its api', () => {
    expect(indexerEndpoint('https://api.nzbgeek.info', { t: 'caps' })).toBe(
      'https://api.nzbgeek.info/api?t=caps',
    );
  });

  it('asks a Jackett feed at the api beneath it', () => {
    expect(
      indexerEndpoint('http://jackett:9117/api/v2.0/indexers/tracker/results/torznab/', {
        t: 'search',
        q: 'dune part two',
      }),
    ).toBe(
      'http://jackett:9117/api/v2.0/indexers/tracker/results/torznab/api?t=search&q=dune+part+two',
    );
  });

  it('leaves an address that already ends in its api alone', () => {
    expect(indexerEndpoint('http://prowlarr:9696/1/api/', { t: 'caps' })).toBe(
      'http://prowlarr:9696/1/api?t=caps',
    );
  });

  it('keeps anything the address already asked for', () => {
    expect(indexerEndpoint('https://indexer.example/api?extended=1', { t: 'caps' })).toBe(
      'https://indexer.example/api?extended=1&t=caps',
    );
  });
});
