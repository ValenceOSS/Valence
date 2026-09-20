import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchDownloadQueue,
  pauseQueuedDownload,
  removeQueuedDownload,
  resumeQueuedDownload,
  sendRelease,
  watchDownloadQueue,
} from './fetchDownloadQueue';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { RealtimeEvent, RealtimeTopic } from '@ValenceContracts/schemas/Realtime';

const A_DOWNLOAD = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  clientId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  clientName: 'qBittorrent',
  protocol: 'torrent',
  libraryKind: 'movies',
  title: 'Dune',
  indexerName: 'Jackett',
  state: 'downloading',
  problem: null,
  progress: 0.5,
  sizeBytes: 1000,
  doneBytes: 500,
  downloadBytesPerSecond: 100,
  uploadBytesPerSecond: 5,
  secondsLeft: 5,
  seeds: 9,
  peers: 2,
  sentAt: '2026-09-19T00:00:00.000Z',
  finishedAt: null,
};

const A_QUEUE = { clients: [], downloads: [A_DOWNLOAD], checkedAt: null };

/**
 * The server, answering every question with the one body.
 */
const answering = (body: object | null, status = 200) => {
  const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(() =>
    Promise.resolve(new Response(body === null ? null : JSON.stringify(body), { status })),
  );

  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchDownloadQueue', () => {
  it('reads the queue', async () => {
    answering(A_QUEUE);

    expect(await fetchDownloadQueue()).toEqual(A_QUEUE);
  });

  it('sends a release, and pauses and resumes a download', async () => {
    const fetchMock = answering(A_DOWNLOAD, 201);

    expect(
      (
        await sendRelease({
          indexerId: A_DOWNLOAD.clientId,
          url: 'magnet:?',
          title: 'Dune',
          protocol: 'torrent',
          libraryKind: 'movies',
        })
      ).value,
    ).toEqual(A_DOWNLOAD);
    expect((await pauseQueuedDownload(A_DOWNLOAD.id)).value).toEqual(A_DOWNLOAD);
    expect((await resumeQueuedDownload(A_DOWNLOAD.id)).value).toEqual(A_DOWNLOAD);
    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      '/api/admin/requests/downloads',
      `/api/admin/requests/downloads/${A_DOWNLOAD.id}/pause`,
      `/api/admin/requests/downloads/${A_DOWNLOAD.id}/resume`,
    ]);
  });

  it('removes a download, deleting what it downloaded only where asked', async () => {
    const fetchMock = answering(null, 204);

    expect(await removeQueuedDownload(A_DOWNLOAD.id, true)).toBeNull();
    expect(await removeQueuedDownload(A_DOWNLOAD.id, false)).toBeNull();
    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      `/api/admin/requests/downloads/${A_DOWNLOAD.id}?deleteData=true`,
      `/api/admin/requests/downloads/${A_DOWNLOAD.id}?deleteData=false`,
    ]);
  });

  it('follows the queue live, ignoring anything that is not one', () => {
    const held: { listener: ((event: RealtimeEvent) => void) | null } = { listener: null };
    const stop = vi.fn();
    const client = {
      subscribe: vi.fn((topic: RealtimeTopic, listen: (event: RealtimeEvent) => void) => {
        void topic;
        held.listener = listen;

        return stop;
      }),
    };
    const heard = vi.fn();

    expect(watchDownloadQueue(heard, client)).toBe(stop);
    expect(client.subscribe).toHaveBeenCalledWith('downloads', expect.any(Function));

    const event = (payload: object): RealtimeEvent => ({
      kind: 'event',
      topic: 'downloads',
      atMs: 0,
      folded: 0,
      payload: JsonValueSchema.parse(payload),
    });

    held.listener?.(event(A_QUEUE));
    held.listener?.(event({ nonsense: true }));

    expect(heard).toHaveBeenCalledTimes(1);
    expect(heard).toHaveBeenCalledWith(A_QUEUE);
  });
});
