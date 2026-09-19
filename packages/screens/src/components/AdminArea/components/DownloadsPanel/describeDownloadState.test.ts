import { describe, expect, it } from 'vitest';
import { describeDownloadState } from './describeDownloadState';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';

const A_DOWNLOAD: QueuedDownload = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  clientId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  clientName: 'qBittorrent',
  protocol: 'torrent',
  libraryKind: 'movies',
  title: 'Dune',
  indexerName: null,
  state: 'queued',
  problem: null,
  progress: 0,
  sizeBytes: null,
  doneBytes: null,
  downloadBytesPerSecond: null,
  uploadBytesPerSecond: null,
  secondsLeft: null,
  seeds: null,
  peers: null,
  sentAt: '2026-09-19T00:00:00.000Z',
  finishedAt: null,
  filedInto: null,
  filingProblem: null,
};

describe('describeDownloadState', () => {
  it.each([
    ['queued', 'Queued', 'quiet'],
    ['downloading', 'Downloading', 'busy'],
    ['paused', 'Paused', 'quiet'],
    ['done', 'Done', 'success'],
  ] as const)('says a %s download is %s', (state, label, tone) => {
    expect(describeDownloadState({ ...A_DOWNLOAD, state })).toEqual({ label, tone, detail: null });
  });

  it('says why a download stalled, or what stalling means for its kind', () => {
    expect(describeDownloadState({ ...A_DOWNLOAD, state: 'stalled' }).detail).toBe(
      'Nobody is sending it.',
    );
    expect(
      describeDownloadState({ ...A_DOWNLOAD, state: 'stalled', protocol: 'usenet' }).detail,
    ).toBe('Nothing is arriving.');
    expect(
      describeDownloadState({ ...A_DOWNLOAD, state: 'stalled', problem: 'Tracker gone' }).detail,
    ).toBe('Tracker gone');
  });

  it('says what finishing means for each kind', () => {
    expect(describeDownloadState({ ...A_DOWNLOAD, state: 'processing' }).detail).toBe('Checking.');
    expect(
      describeDownloadState({ ...A_DOWNLOAD, state: 'processing', protocol: 'usenet' }).detail,
    ).toBe('Checking and unpacking.');
  });

  it('says why a download failed, or that it did', () => {
    expect(
      describeDownloadState({ ...A_DOWNLOAD, state: 'failed', problem: 'Out of retention' }),
    ).toEqual({
      label: 'Failed',
      tone: 'danger',
      detail: 'Out of retention',
    });
    expect(describeDownloadState({ ...A_DOWNLOAD, state: 'failed' }).detail).toBe('It failed.');
  });

  it('says where a finished download was filed, or why it could not be', () => {
    expect(
      describeDownloadState({
        ...A_DOWNLOAD,
        state: 'done',
        filedInto: '/media/Films/The Matrix (1999)',
      }),
    ).toEqual({
      label: 'Completed',
      tone: 'success',
      detail: 'Filed into /media/Films/The Matrix (1999).',
    });
    expect(
      describeDownloadState({
        ...A_DOWNLOAD,
        state: 'done',
        filingProblem: 'qBittorrent has not said where it put the download',
      }),
    ).toEqual({
      label: 'Not filed',
      tone: 'warning',
      detail: 'qBittorrent has not said where it put the download',
    });
  });
});
