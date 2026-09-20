import { describe, expect, it } from 'vitest';
import {
  DownloadRemovalSchema,
  DownloadStreamFrameSchema,
  ReleaseSendSchema,
} from './DownloadQueue';

describe('ReleaseSendSchema', () => {
  it('takes a release without its size', () => {
    expect(
      ReleaseSendSchema.parse({
        indexerId: '0f8fad5b-d9cb-469f-a165-70867728950e',
        url: 'magnet:?xt=urn:btih:abc',
        title: ' Dune ',
        protocol: 'torrent',
        libraryKind: 'movies',
      }),
    ).toEqual({
      indexerId: '0f8fad5b-d9cb-469f-a165-70867728950e',
      url: 'magnet:?xt=urn:btih:abc',
      title: 'Dune',
      protocol: 'torrent',
      libraryKind: 'movies',
      sizeBytes: null,
      indexerName: null,
      library: null,
    });
  });
});

describe('DownloadRemovalSchema', () => {
  it('keeps what was downloaded unless told otherwise', () => {
    expect(DownloadRemovalSchema.parse({})).toEqual({ deleteData: false });
  });
});

describe('DownloadStreamFrameSchema', () => {
  it('reads the events a stream carries', () => {
    const frame = DownloadStreamFrameSchema.parse({
      kind: 'events',
      events: [
        {
          id: 1,
          kind: 'failed',
          title: 'Dune',
          clientName: 'qBittorrent',
          problem: 'The tracker is gone',
          at: '2026-09-19T00:00:00.000Z',
        },
      ],
    });

    expect(frame.kind).toBe('events');
  });

  it('reads a request filed into a library', () => {
    const frame = DownloadStreamFrameSchema.parse({
      kind: 'events',
      events: [
        {
          id: 2,
          kind: 'filed',
          title: 'Dune',
          requestId: '0f8fad5b-d9cb-469f-a165-70867728950e',
          requestedById: 'someone',
          requestKind: 'film',
          tmdbId: 438631,
          libraryId: 'films',
          folder: '/media/Films/Dune (2021)',
          at: '2026-09-19T00:00:00.000Z',
        },
      ],
    });

    expect(frame.kind === 'events' ? frame.events[0]?.kind : null).toBe('filed');
  });

  it('refuses a frame it does not know', () => {
    expect(() => DownloadStreamFrameSchema.parse({ kind: 'gossip' })).toThrow();
  });
});
