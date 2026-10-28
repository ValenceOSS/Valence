import { describe, expect, it } from 'vitest';
import { IndexerAskingSchema, RequestNowSchema, RequestSearchingSchema } from './RequestNow';

const PROGRESS = {
  downloadId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  state: 'downloading',
  progress: 0.5,
  sizeBytes: 1000,
  doneBytes: 500,
  downloadBytesPerSecond: 100,
  secondsLeft: 5,
};

describe('RequestNowSchema', () => {
  it('reads a search and the indexers it is waiting on', () => {
    const now = RequestNowSchema.parse({
      stage: 'search',
      startedAt: '2026-10-09T17:12:28.000Z',
      indexers: [{ name: 'Nyaa', state: 'asking', found: 0 }],
    });

    expect(now?.stage).toBe('search');
  });

  it('reads a download, with its title and the client fetching it', () => {
    expect(
      RequestNowSchema.parse({
        ...PROGRESS,
        stage: 'download',
        title: 'Dune',
        clientName: 'qBittorrent',
      }),
    ).toMatchObject({ stage: 'download', clientName: 'qBittorrent', progress: 0.5 });
  });

  it('reads an import, and nothing at all between steps', () => {
    expect(RequestNowSchema.parse({ stage: 'import', title: 'Dune' })).toEqual({
      stage: 'import',
      title: 'Dune',
    });
    expect(RequestNowSchema.parse(null)).toBeNull();
  });

  it('refuses a stage it does not know, and a download with no client', () => {
    expect(() => RequestNowSchema.parse({ stage: 'release' })).toThrow();
    expect(() =>
      RequestNowSchema.parse({ ...PROGRESS, stage: 'download', title: 'Dune' }),
    ).toThrow();
  });
});

describe('RequestSearchingSchema', () => {
  it('refuses a start that is not a moment', () => {
    expect(() => RequestSearchingSchema.parse({ startedAt: 'today', indexers: [] })).toThrow();
  });
});

describe('IndexerAskingSchema', () => {
  it('refuses a state it does not know, and a count found below nothing', () => {
    expect(() => IndexerAskingSchema.parse({ name: 'Nyaa', state: 'busy', found: 0 })).toThrow();
    expect(() =>
      IndexerAskingSchema.parse({ name: 'Nyaa', state: 'answered', found: -1 }),
    ).toThrow();
  });
});
