import { aDownloadClient } from '@ValenceRequests/testing/aDownloadClient';
import type { SentDownloadRecord } from '@ValenceRequests/downloads/SentDownloadRecord';

/**
 * A torrent of Dune sent to the client `aDownloadClient` makes, half downloaded, with anything a
 * test cares about changed.
 *
 * @param overrides - What to change.
 * @returns The download as kept.
 */
const aSentDownload = (overrides: Partial<SentDownloadRecord> = {}): SentDownloadRecord => ({
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  clientId: aDownloadClient().id,
  remoteId: 'c12fe1c06bba254a9dc9f519b335aa7c1367a88a',
  contentPath: null,
  protocol: 'torrent',
  libraryKind: 'movies',
  title: 'Dune',
  indexerName: 'Jackett',
  state: 'downloading',
  problem: null,
  progress: 0.5,
  sizeBytes: 1000,
  doneBytes: 500,
  sentAt: '2026-09-19T00:00:00.000Z',
  finishedAt: null,
  updatedAt: '2026-09-19T00:00:00.000Z',
  ...overrides,
});

export { aSentDownload };
