import { DEFAULT_DOWNLOAD_CATEGORIES } from '@ValenceContracts/schemas/DownloadClient';
import { describe, expect, it, vi } from 'vitest';
import { createDownloadRoutes } from './createDownloadRoutes';
import type { DownloadClient, DownloadClientTest } from '@ValenceContracts/schemas/DownloadClient';
import type {
  DownloadQueue,
  DownloadStreamFrame,
  QueuedDownload,
} from '@ValenceContracts/schemas/DownloadQueue';

const CLIENT: DownloadClient = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'qBittorrent',
  kind: 'qbittorrent',
  url: 'http://qbittorrent:8080',
  username: 'admin',
  hasPassword: true,
  hasApiKey: false,
  categories: DEFAULT_DOWNLOAD_CATEGORIES,
  priority: 25,
  isEnabled: true,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const WORKING: DownloadClientTest = { isWorking: true, problem: null, version: 'v5.0.1' };

const DOWNLOAD: QueuedDownload = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  clientId: CLIENT.id,
  clientName: 'qBittorrent',
  protocol: 'torrent',
  libraryKind: 'movies',
  title: 'Dune',
  indexerName: 'Jackett',
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
};

const QUEUE: DownloadQueue = { clients: [], downloads: [DOWNLOAD], checkedAt: null };

const DRAFT = { name: 'qBittorrent', kind: 'qbittorrent', url: 'http://qbittorrent:8080' };

const SEND = {
  indexerId: CLIENT.id,
  url: 'magnet:?xt=urn:btih:x',
  title: 'Dune',
  protocol: 'torrent',
  libraryKind: 'movies',
};

/**
 * The routes over services that answer as the test says.
 */
const theRoutes = () => {
  let listening: ((frame: DownloadStreamFrame) => void) | null = null;
  const stopListening = vi.fn();
  const clients = {
    list: vi.fn(() => Promise.resolve([CLIENT])),
    add: vi.fn(() => Promise.resolve(CLIENT)),
    change: vi.fn((id: string) => Promise.resolve(id === CLIENT.id ? CLIENT : null)),
    remove: vi.fn((id: string) => Promise.resolve(id === CLIENT.id)),
    test: vi.fn((id: string) => Promise.resolve(id === CLIENT.id ? WORKING : null)),
    tryDraft: vi.fn(() => Promise.resolve(WORKING)),
  };
  const queue = {
    queue: vi.fn(() => Promise.resolve(QUEUE)),
    send: vi.fn((): Promise<QueuedDownload | string> => Promise.resolve(DOWNLOAD)),
    pause: vi.fn((id: string): Promise<QueuedDownload | string | null> =>
      Promise.resolve(id === DOWNLOAD.id ? DOWNLOAD : null),
    ),
    resume: vi.fn((): Promise<QueuedDownload | string | null> => Promise.resolve('It is gone')),
    remove: vi.fn((id: string): Promise<boolean | string> => Promise.resolve(id === DOWNLOAD.id)),
    watch: vi.fn(),
    listen: vi.fn((listener: (frame: DownloadStreamFrame) => void) => {
      listening = listener;

      return stopListening;
    }),
    acknowledge: vi.fn(() => Promise.resolve()),
  };
  const routes = createDownloadRoutes({ clients, queue, keepAliveMs: 5 });

  const ask = (path: string, method = 'GET', body?: object | string) =>
    routes.request(path, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body === undefined
        ? {}
        : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    });

  return {
    ask,
    routes,
    clients,
    queue,
    stopListening,
    tell: (frame: DownloadStreamFrame) => listening?.(frame),
  };
};

describe('createDownloadRoutes', () => {
  describe('clients', () => {
    it('lists, adds and tries clients', async () => {
      const { ask, clients } = theRoutes();

      expect(await (await ask('/clients')).json()).toEqual([CLIENT]);
      expect((await ask('/clients', 'POST', DRAFT)).status).toBe(201);
      expect(await (await ask('/clients/try', 'POST', DRAFT)).json()).toEqual(WORKING);
      expect(await (await ask(`/clients/${CLIENT.id}/try`, 'POST', DRAFT)).json()).toEqual(WORKING);
      expect(clients.tryDraft).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: 'qBittorrent' }),
        CLIENT.id,
      );
    });

    it('refuses what is not a client', async () => {
      const { ask } = theRoutes();

      expect((await ask('/clients', 'POST', { name: 'x' })).status).toBe(400);
      expect((await ask('/clients/try', 'POST', 'nonsense')).status).toBe(400);
      expect((await ask(`/clients/${CLIENT.id}/try`, 'POST', {})).status).toBe(400);
      expect((await ask(`/clients/${CLIENT.id}`, 'PATCH', { priority: 99 })).status).toBe(400);
    });

    it('changes, tests and removes a client, and says when there is no such one', async () => {
      const { ask } = theRoutes();

      expect((await ask(`/clients/${CLIENT.id}`, 'PATCH', { isEnabled: false })).status).toBe(200);
      expect((await ask('/clients/other', 'PATCH', { isEnabled: false })).status).toBe(404);
      expect(await (await ask(`/clients/${CLIENT.id}/test`, 'POST')).json()).toEqual(WORKING);
      expect((await ask('/clients/other/test', 'POST')).status).toBe(404);
      expect((await ask(`/clients/${CLIENT.id}`, 'DELETE')).status).toBe(204);
      expect((await ask('/clients/other', 'DELETE')).status).toBe(404);
    });
  });

  describe('the queue', () => {
    it('reads the queue, and sends a release', async () => {
      const { ask } = theRoutes();

      expect(await (await ask('/downloads')).json()).toEqual(QUEUE);

      const sent = await ask('/downloads', 'POST', SEND);

      expect(sent.status).toBe(201);
      expect(await sent.json()).toEqual(DOWNLOAD);
    });

    it('says why a release could not be sent', async () => {
      const { ask, queue } = theRoutes();

      queue.send.mockResolvedValueOnce('No torrent client is set up and switched on');

      const refused = await ask('/downloads', 'POST', SEND);

      expect(refused.status).toBe(400);
      expect(await refused.json()).toEqual({
        error: 'No torrent client is set up and switched on',
      });
      expect((await ask('/downloads', 'POST', { title: 'Dune' })).status).toBe(400);
    });

    it('pauses and resumes a download, saying why not where it could not', async () => {
      const { ask } = theRoutes();

      expect(await (await ask(`/downloads/${DOWNLOAD.id}/pause`, 'POST')).json()).toEqual(DOWNLOAD);
      expect((await ask('/downloads/other/pause', 'POST')).status).toBe(404);

      const refused = await ask(`/downloads/${DOWNLOAD.id}/resume`, 'POST');

      expect(refused.status).toBe(400);
      expect(await refused.json()).toEqual({ error: 'It is gone' });
    });

    it('removes a download, deleting its data only where asked', async () => {
      const { ask, queue } = theRoutes();

      expect((await ask(`/downloads/${DOWNLOAD.id}?deleteData=true`, 'DELETE')).status).toBe(204);
      expect(queue.remove).toHaveBeenLastCalledWith(DOWNLOAD.id, true);
      expect((await ask(`/downloads/${DOWNLOAD.id}`, 'DELETE')).status).toBe(204);
      expect(queue.remove).toHaveBeenLastCalledWith(DOWNLOAD.id, false);
      expect((await ask('/downloads/other', 'DELETE')).status).toBe(404);

      queue.remove.mockResolvedValueOnce('qBittorrent could not be reached');

      expect((await ask(`/downloads/${DOWNLOAD.id}`, 'DELETE')).status).toBe(400);
    });

    it('hears whether anybody is watching, and which events were heard', async () => {
      const { ask, queue } = theRoutes();

      expect((await ask('/downloads/watch', 'POST', { isWatching: true })).status).toBe(204);
      expect(queue.watch).toHaveBeenCalledWith(true);
      expect((await ask('/downloads/watch', 'POST', {})).status).toBe(400);
      expect((await ask('/downloads/events/ack', 'POST', { ids: [1, 2] })).status).toBe(204);
      expect(queue.acknowledge).toHaveBeenCalledWith([1, 2]);
      expect((await ask('/downloads/events/ack', 'POST', { ids: ['x'] })).status).toBe(400);
    });

    it('streams the queue as it changes, keeping quiet stretches alive, until it is closed', async () => {
      const { routes, tell, stopListening } = theRoutes();
      const closing = new AbortController();
      const response = await routes.request('/downloads/stream', { signal: closing.signal });
      const reader = response.body?.getReader();

      expect(response.headers.get('content-type')).toContain('text/event-stream');

      await vi.waitFor(() => {
        expect(tell).toBeDefined();
      });

      let said = '';

      await vi.waitFor(async () => {
        tell({ kind: 'queue', queue: QUEUE });

        const chunk = await reader?.read();

        said += chunk?.value instanceof Uint8Array ? new TextDecoder().decode(chunk.value) : '';

        expect(said).toContain(JSON.stringify({ kind: 'queue', queue: QUEUE }));
      });

      await vi.waitFor(async () => {
        const chunk = await reader?.read();

        said += chunk?.value instanceof Uint8Array ? new TextDecoder().decode(chunk.value) : '';

        expect(said).toContain(': still here');
      });

      closing.abort();
      await reader?.cancel();

      await vi.waitFor(() => {
        expect(stopListening).toHaveBeenCalled();
      });
    });
  });
});
