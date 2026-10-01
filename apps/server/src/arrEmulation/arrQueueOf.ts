import { arrIdOf } from '@ValenceServer/arrEmulation/arrIdOf';
import { timeLeftOf } from '@ValenceServer/arrEmulation/timeLeftOf';
import { episodeIdOf } from '@ValenceServer/arrEmulation/episodeIdOf';
import type { ArrKind } from '@ValenceServer/arrEmulation/ArrEmulation';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { MediaRequest } from '@ValenceContracts/schemas/MediaRequest';

type ArrQueueRecord = {
  id: number;
  movieId?: number;
  seriesId?: number;
  episodeId?: number;
  episode?: { id: number; seasonNumber: number; episodeNumber: number; title: string };
  title: string;
  size: number;
  sizeleft: number;
  status: 'queued' | 'paused' | 'downloading' | 'completed' | 'failed' | 'warning';
  trackedDownloadStatus: 'ok' | 'warning' | 'error';
  trackedDownloadState: 'downloading' | 'importPending' | 'failedPending';
  timeleft?: string;
  estimatedCompletionTime?: string;
  downloadId: string;
  protocol: QueuedDownload['protocol'];
  downloadClient: string;
  indexer: string;
};

type ArrQueue = {
  page: number;
  pageSize: number;
  sortKey: 'timeleft';
  sortDirection: 'ascending';
  totalRecords: number;
  records: ArrQueueRecord[];
};

const STATUS_OF: Record<QueuedDownload['state'], ArrQueueRecord['status']> = {
  queued: 'queued',
  metadata: 'queued',
  downloading: 'downloading',
  stalled: 'warning',
  paused: 'paused',
  processing: 'completed',
  done: 'completed',
  failed: 'failed',
};

const MILLISECONDS = 1000;

/**
 * The downloads the films or series asked for are waiting on, as Radarr's or Sonarr's queue lists
 * them: one line a film, or one an episode, with its size, what is left and when it should be done.
 *
 * @param kind - Whether this is Radarr's queue of films or Sonarr's of series.
 * @param requests - Every request.
 * @param downloads - Every download the requests service is following.
 * @param now - The time now, to say when each should be done by.
 * @returns The queue, all on one page.
 */
const arrQueueOf = (
  kind: ArrKind,
  requests: readonly MediaRequest[],
  downloads: readonly QueuedDownload[],
  now: Date,
): ArrQueue => {
  const byId = new Map(downloads.map((download) => [download.id, download]));
  const records = requests
    .filter((request) => request.kind === kind && request.tmdbId !== null)
    .flatMap((request) => {
      const tmdbId = request.tmdbId ?? 0;
      const lines = request.items.flatMap((item) => {
        const download = item.downloadId === null ? undefined : byId.get(item.downloadId);

        return download === undefined ? [] : [{ item, download }];
      });
      const once =
        kind === 'film'
          ? lines.filter(
              (line, index) =>
                lines.findIndex((other) => other.download.id === line.download.id) === index,
            )
          : lines;

      return once.map(({ item, download }): ArrQueueRecord => {
        const size = download.sizeBytes ?? 0;
        const left = Math.max(0, size - (download.doneBytes ?? size * download.progress));
        const episode =
          kind === 'series' && item.season !== null && item.episode !== null
            ? {
                id: episodeIdOf(item.season, item.episode),
                seasonNumber: item.season,
                episodeNumber: item.episode,
                title: item.title,
              }
            : null;

        return {
          id: arrIdOf(download.id) + (episode?.id ?? 0),
          ...(kind === 'film'
            ? { movieId: tmdbId }
            : {
                seriesId: tmdbId,
                ...(episode === null ? {} : { episodeId: episode.id, episode }),
              }),
          title: download.title,
          size,
          sizeleft: left,
          status: STATUS_OF[download.state],
          trackedDownloadStatus:
            download.state === 'failed' ? 'error' : download.problem === null ? 'ok' : 'warning',
          trackedDownloadState:
            download.state === 'failed'
              ? 'failedPending'
              : download.state === 'done' || download.state === 'processing'
                ? 'importPending'
                : 'downloading',
          ...(download.secondsLeft === null
            ? {}
            : {
                timeleft: timeLeftOf(download.secondsLeft),
                estimatedCompletionTime: new Date(
                  now.getTime() + download.secondsLeft * MILLISECONDS,
                ).toISOString(),
              }),
          downloadId: download.id,
          protocol: download.protocol,
          downloadClient: download.clientName,
          indexer: download.indexerName ?? '',
        };
      });
    });

  return {
    page: 1,
    pageSize: Math.max(records.length, 1),
    sortKey: 'timeleft',
    sortDirection: 'ascending',
    totalRecords: records.length,
    records,
  };
};

export { arrQueueOf };

export type { ArrQueue, ArrQueueRecord };
