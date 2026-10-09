import { describe, expect, it } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { downloadsOfRequest } from './downloadsOfRequest';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';

const PACK = '6ba7b810-9dad-11d1-80b4-000000000101';
const SINGLE = '6ba7b810-9dad-11d1-80b4-000000000102';

/**
 * A download a client has, sent at the time given.
 *
 * @param id - Its id.
 * @param sentAt - When it was sent.
 * @returns The download.
 */
const aQueued = (id: string, sentAt: string): QueuedDownload => ({
  id,
  clientId: '6ba7b810-9dad-11d1-80b4-000000000200',
  clientName: 'qBittorrent',
  protocol: 'torrent',
  libraryKind: 'shows',
  title: id,
  indexerName: 'Indexer',
  state: 'downloading',
  problem: null,
  problemCode: null,
  progress: 0.5,
  sizeBytes: 10,
  doneBytes: 5,
  downloadBytesPerSecond: 1,
  uploadBytesPerSecond: null,
  secondsLeft: 5,
  seeds: 3,
  peers: 4,
  sentAt,
  finishedAt: null,
  filedInto: null,
  filingProblem: null,
  filingProblemCode: null,
  wasPaused: false,
});

describe('downloadsOfRequest', () => {
  it('gives each download its own row with what it holds, oldest first', () => {
    const request = aMediaRequest({
      items: [
        aRequestItem({ id: 'e1', state: 'downloading', downloadId: PACK, releaseTitle: 'Pack' }),
        aRequestItem({ id: 'e2', state: 'downloading', downloadId: PACK, releaseTitle: 'Pack' }),
        aRequestItem({ id: 'e3', state: 'chosen', downloadId: SINGLE, releaseTitle: 'One' }),
        aRequestItem({ id: 'e4', state: 'available', downloadId: SINGLE }),
      ],
    });
    const rows = downloadsOfRequest(request, [
      aQueued(SINGLE, '2026-01-01T00:00:00.000Z'),
      aQueued(PACK, '2026-01-02T00:00:00.000Z'),
    ]);

    expect(rows.map((row) => [row.releaseTitle, row.items.length])).toEqual([
      ['One', 1],
      ['Pack', 2],
    ]);
    expect(rows[1]?.queued?.sentAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('keeps a download the client no longer lists, without its progress', () => {
    const [row] = downloadsOfRequest(
      aMediaRequest({ items: [aRequestItem({ state: 'downloading', downloadId: PACK })] }),
      [],
    );

    expect(row?.queued).toBeNull();
  });
});
