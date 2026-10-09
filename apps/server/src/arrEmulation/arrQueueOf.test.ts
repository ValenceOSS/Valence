import { describe, expect, it } from 'vitest';
import { arrQueueOf } from './arrQueueOf';
import { aSeerrRequest } from './testing/aSeerrRequest';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

const NOW = new Date('2026-10-01T12:00:00.000Z');

const DOWNLOAD: QueuedDownload = {
  id: '4f9c1e2a-3b5d-4c6e-8f7a-9b0c1d2e3f4a',
  clientId: '5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d',
  clientName: 'qBittorrent',
  protocol: 'torrent',
  libraryKind: 'shows',
  title: 'Stranger.Things.S01.1080p',
  indexerName: null,
  state: 'downloading',
  problem: null,
  problemCode: null,
  progress: 0.25,
  sizeBytes: 4000,
  doneBytes: null,
  downloadBytesPerSecond: 10,
  uploadBytesPerSecond: 0,
  secondsLeft: 3600,
  seeds: 1,
  peers: 1,
  sentAt: '2026-10-01T10:00:00.000Z',
  finishedAt: null,
  filedInto: null,
  filingProblem: null,
  filingProblemCode: null,
  wasPaused: false,
};

const item = (season: number | null, episode: number | null): MediaRequest['items'][number] => ({
  id: `7e8f9a0b-1c2d-4e3f-8a4b-5c6d7e8f9a${(season ?? 0).toString()}${(episode ?? 0).toString()}`,
  musicBrainzId: null,
  season,
  episode,
  title: 'Chapter',
  airDate: null,
  state: 'downloading',
  problem: null,
  problemCode: null,
  releaseTitle: DOWNLOAD.title,
  downloadId: DOWNLOAD.id,
  filePath: null,
  score: null,
  isFollowed: true,
  lastSearchedAt: null,
  updatedAt: '2026-10-01T10:00:00.000Z',
});

describe('arrQueueOf', () => {
  it('lists a season pack once for each episode in it, as Sonarr does', () => {
    const request = aSeerrRequest({
      kind: 'series',
      tmdbId: 66732,
      items: [item(1, 1), item(1, 2)],
    });
    const queue = arrQueueOf('series', [request], [DOWNLOAD], NOW);

    expect(queue.totalRecords).toBe(2);
    expect(queue.records[0]).toMatchObject({
      seriesId: 66732,
      episode: { seasonNumber: 1, episodeNumber: 1 },
      size: 4000,
      sizeleft: 3000,
      timeleft: '01:00:00',
      estimatedCompletionTime: '2026-10-01T13:00:00.000Z',
    });
    expect(queue.records[0]?.id).not.toBe(queue.records[1]?.id);
  });

  it('lists a film once however many items share its download', () => {
    const request = aSeerrRequest({ items: [item(null, null), item(null, null)] });

    expect(arrQueueOf('film', [request], [DOWNLOAD], NOW).records).toHaveLength(1);
  });

  it('leaves out the other kind, and downloads nobody here is waiting on', () => {
    const request = aSeerrRequest({ items: [item(null, null)] });

    expect(arrQueueOf('series', [request], [DOWNLOAD], NOW).records).toEqual([]);
    expect(arrQueueOf('film', [aSeerrRequest()], [DOWNLOAD], NOW).records).toEqual([]);
  });

  it('says a failed download failed, and one finished is waiting to be filed', () => {
    const request = aSeerrRequest({ items: [item(null, null)] });

    expect(
      arrQueueOf('film', [request], [{ ...DOWNLOAD, state: 'failed' }], NOW).records[0],
    ).toMatchObject({ status: 'failed', trackedDownloadState: 'failedPending' });
    expect(
      arrQueueOf('film', [request], [{ ...DOWNLOAD, state: 'done', secondsLeft: null }], NOW)
        .records[0],
    ).toMatchObject({ status: 'completed', trackedDownloadState: 'importPending' });
  });
});
