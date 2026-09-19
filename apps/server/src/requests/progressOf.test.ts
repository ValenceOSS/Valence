import { describe, expect, it } from 'vitest';
import { progressOf } from './progressOf';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { MediaRequest, RequestItem } from '@ValenceContracts/schemas/MediaRequest';

const MINE = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const THEIRS = '3f2504e0-4f89-41d3-9a0c-0305e82c3302';

/**
 * A download the requests service is following.
 */
const aDownload = (id: string): QueuedDownload => ({
  id,
  clientId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  clientName: 'qBittorrent',
  protocol: 'torrent',
  libraryKind: 'movies',
  title: 'Dune.2021.1080p',
  indexerName: 'Nyaa.si',
  state: 'downloading',
  problem: null,
  progress: 0.4,
  sizeBytes: 1000,
  doneBytes: 400,
  downloadBytesPerSecond: 50,
  uploadBytesPerSecond: 2,
  secondsLeft: 12,
  seeds: 3,
  peers: 1,
  sentAt: '2026-09-19T00:00:00.000Z',
  finishedAt: null,
  filedInto: null,
  filingProblem: null,
});

/**
 * An item of a request, waiting on the download given.
 */
const anItem = (downloadId: string | null): RequestItem => ({
  id: '1c6a7e2b-3d4f-4a5b-9c8d-7e6f5a4b3c2d',
  musicBrainzId: null,
  season: null,
  episode: null,
  title: 'Dune',
  airDate: null,
  state: 'downloading',
  problem: null,
  releaseTitle: null,
  downloadId,
  filePath: null,
  score: null,
  lastSearchedAt: null,
  updatedAt: '2026-09-19T00:00:00.000Z',
});

describe('progressOf', () => {
  it('says how the downloads a viewer waits on are going, and nobody else’s', () => {
    const request = { items: [anItem(MINE), anItem(null)] } satisfies Pick<MediaRequest, 'items'>;

    expect(progressOf([request], [aDownload(MINE), aDownload(THEIRS)])).toEqual([
      {
        downloadId: MINE,
        state: 'downloading',
        progress: 0.4,
        sizeBytes: 1000,
        doneBytes: 400,
        downloadBytesPerSecond: 50,
        secondsLeft: 12,
      },
    ]);
  });
});
