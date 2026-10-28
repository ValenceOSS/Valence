import { describe, expect, it } from 'vitest';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import { aMediaRequest } from '@ValenceRequests/testing/aMediaRequest';
import { aSentDownload } from '@ValenceRequests/testing/aSentDownload';
import { createRequestNow } from './createRequestNow';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { SentDownloadRecord } from '@ValenceRequests/downloads/SentDownloadRecord';

const SEARCHING = {
  startedAt: '2026-09-19T00:00:00.000Z',
  indexers: [{ name: 'TorrentGalaxy', state: 'asking' as const, found: 0 }],
};

/**
 * The reader over one request and the downloads given, with the queue showing each as going at a
 * megabyte a second.
 */
const theNow = async (
  request: MediaRequestRecord,
  sent: readonly SentDownloadRecord[],
): Promise<ReturnType<typeof createRequestNow>> => {
  const requests = createMemoryRecordStore<MediaRequestRecord>();
  const downloads = createMemoryRecordStore<SentDownloadRecord>();

  await requests.insert(request);

  for (const download of sent) {
    await downloads.insert(download);
  }

  const shown = sent.map((download): QueuedDownload => ({
    ...download,
    clientName: 'qBittorrent',
    phase: null,
    canPause: true,
    downloadBytesPerSecond: 1_000_000,
    uploadBytesPerSecond: null,
    secondsLeft: 30,
    seeds: null,
    peers: null,
  }));

  return createRequestNow({
    requests,
    downloads,
    queue: { queue: () => Promise.resolve({ clients: [], downloads: shown, checkedAt: null }) },
  });
};

describe('createRequestNow', () => {
  it('says which indexers a request is searching while it searches', async () => {
    const request = aMediaRequest({ searching: SEARCHING });
    const now = await theNow(request, [aSentDownload({ requestId: request.id })]);

    expect(await now(request.id)).toStrictEqual({ stage: 'search', ...SEARCHING });
  });

  it('says how its newest download is going, speed and time left included', async () => {
    const request = aMediaRequest();
    const now = await theNow(request, [
      aSentDownload({ requestId: request.id, state: 'done' }),
      aSentDownload({
        id: '3f2504e0-4f89-41d3-9a0c-0305e82c3302',
        requestId: request.id,
        sentAt: '2026-09-20T00:00:00.000Z',
        title: 'Dune.2021.2160p',
      }),
    ]);

    expect(await now(request.id)).toStrictEqual({
      stage: 'download',
      title: 'Dune.2021.2160p',
      clientName: 'qBittorrent',
      downloadId: '3f2504e0-4f89-41d3-9a0c-0305e82c3302',
      state: 'downloading',
      progress: 0.5,
      sizeBytes: 1000,
      doneBytes: 500,
      downloadBytesPerSecond: 1_000_000,
      secondsLeft: 30,
    });
  });

  it('says it is filing a download that is being processed', async () => {
    const request = aMediaRequest();
    const now = await theNow(request, [
      aSentDownload({ requestId: request.id, state: 'processing' }),
    ]);

    expect(await now(request.id)).toStrictEqual({ stage: 'import', title: 'Dune' });
  });

  it('says nothing when the request is doing nothing, or is not there', async () => {
    const request = aMediaRequest();
    const now = await theNow(request, [
      aSentDownload({ requestId: request.id, state: 'done' }),
      aSentDownload({
        id: '3f2504e0-4f89-41d3-9a0c-0305e82c3303',
        sentAt: '2026-09-21T00:00:00.000Z',
      }),
    ]);

    expect(await now(request.id)).toBeNull();
    expect(await now('missing')).toBeNull();
  });
});
