import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { DownloadsPanel } from './DownloadsPanel';
import type { DownloadClient } from '@ValenceContracts/schemas/DownloadClient';
import type { DownloadQueue, QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type * as Clients from '@ValenceClient/requests/fetchDownloadClients';
import type * as Queue from '@ValenceClient/requests/fetchDownloadQueue';

const fetchDownloadClients = vi.fn<typeof Clients.fetchDownloadClients>();
const changeDownloadClient = vi.fn<typeof Clients.changeDownloadClient>();
const removeDownloadClient = vi.fn<typeof Clients.removeDownloadClient>();
const testDownloadClient = vi.fn<typeof Clients.testDownloadClient>();

const fetchDownloadQueue = vi.fn<typeof Queue.fetchDownloadQueue>();
const pauseQueuedDownload = vi.fn<typeof Queue.pauseQueuedDownload>();
const resumeQueuedDownload = vi.fn<typeof Queue.resumeQueuedDownload>();
const removeQueuedDownload = vi.fn<typeof Queue.removeQueuedDownload>();
const stopWatching = vi.fn();
const heard: { onQueue: ((queue: DownloadQueue) => void) | null } = { onQueue: null };

vi.mock('@ValenceClient/requests/fetchDownloadClients', () => ({
  fetchDownloadClients: () => fetchDownloadClients(),
  changeDownloadClient: (...given: Parameters<typeof Clients.changeDownloadClient>) =>
    changeDownloadClient(...given),
  removeDownloadClient: (id: string) => removeDownloadClient(id),
  testDownloadClient: (id: string) => testDownloadClient(id),
  addDownloadClient: vi.fn(),
  tryDownloadClient: vi.fn(),
}));

vi.mock('@ValenceClient/requests/fetchDownloadQueue', () => ({
  fetchDownloadQueue: () => fetchDownloadQueue(),
  pauseQueuedDownload: (id: string) => pauseQueuedDownload(id),
  resumeQueuedDownload: (id: string) => resumeQueuedDownload(id),
  removeQueuedDownload: (id: string, deleteData: boolean) => removeQueuedDownload(id, deleteData),
  watchDownloadQueue: (onQueue: (queue: DownloadQueue) => void) => {
    heard.onQueue = onQueue;

    return stopWatching;
  },
}));

const CLIENT: DownloadClient = {
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'qBittorrent',
  kind: 'qbittorrent',
  url: 'http://qbittorrent:8080',
  username: 'admin',
  hasPassword: true,
  hasApiKey: false,
  categories: {
    movies: 'valence-films',
    shows: 'valence-series',
    music: 'valence-music',
    books: 'valence-books',
  },
  priority: 25,
  isEnabled: true,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const NZBGET: DownloadClient = {
  ...CLIENT,
  id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  name: 'NZBGet',
  kind: 'nzbget',
  url: 'http://nzbget:6789',
};

const DOWNLOAD: QueuedDownload = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  clientId: CLIENT.id,
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
  secondsLeft: 30,
  seeds: 9,
  peers: 2,
  sentAt: '2026-09-19T00:00:00.000Z',
  finishedAt: null,
};

const QUEUE: DownloadQueue = {
  clients: [
    {
      id: CLIENT.id,
      name: 'qBittorrent',
      kind: 'qbittorrent',
      isEnabled: true,
      isReachable: true,
      problem: null,
      downloadBytesPerSecond: 2 * 1024 ** 2,
      uploadBytesPerSecond: 1024,
      checkedAt: '2026-09-19T00:00:00.000Z',
    },
    {
      id: NZBGET.id,
      name: 'NZBGet',
      kind: 'nzbget',
      isEnabled: true,
      isReachable: true,
      problem: null,
      downloadBytesPerSecond: 1024 ** 2,
      uploadBytesPerSecond: null,
      checkedAt: '2026-09-19T00:00:00.000Z',
    },
  ],
  downloads: [DOWNLOAD],
  checkedAt: '2026-09-19T00:00:00.000Z',
};

beforeEach(() => {
  heard.onQueue = null;
  stopWatching.mockReset();
  fetchDownloadClients.mockReset().mockResolvedValue([CLIENT, NZBGET]);
  fetchDownloadQueue.mockReset().mockResolvedValue(QUEUE);
  changeDownloadClient.mockReset().mockResolvedValue({ value: CLIENT, refusal: null });
  removeDownloadClient.mockReset().mockResolvedValue(null);
  testDownloadClient
    .mockReset()
    .mockResolvedValue({ value: { isWorking: true, problem: null, version: 'v5' }, refusal: null });
  pauseQueuedDownload.mockReset().mockResolvedValue({ value: DOWNLOAD, refusal: null });
  resumeQueuedDownload.mockReset().mockResolvedValue({ value: DOWNLOAD, refusal: null });
  removeQueuedDownload.mockReset().mockResolvedValue(null);
});

/**
 * Chooses an action from a row's menu.
 */
const choose = async (user: ReturnType<typeof userEvent.setup>, row: string, item: RegExp) => {
  await user.click(await screen.findByRole('button', { name: `Actions for ${row}` }));
  await user.click(await screen.findByRole('menuitem', { name: item }));
};

describe('DownloadsPanel', () => {
  it('shows the queue, and how fast everything is going altogether', async () => {
    renderInAnAddress(<DownloadsPanel />);

    expect(await screen.findByText('Dune')).toBeInTheDocument();
    expect(screen.getByText('↓ 3.0 MB/s · ↑ 1.0 KB/s')).toBeInTheDocument();
  });

  it('follows the queue live, and stops when it is left', async () => {
    const { unmount } = renderInAnAddress(<DownloadsPanel />);

    await screen.findByText('Dune');

    act(() => {
      heard.onQueue?.({ ...QUEUE, downloads: [{ ...DOWNLOAD, title: 'Arrival', progress: 0.9 }] });
    });

    expect(await screen.findByText('Arrival')).toBeInTheDocument();
    expect(screen.queryByText('Dune')).not.toBeInTheDocument();

    unmount();

    expect(stopWatching).toHaveBeenCalled();
  });

  it('shows no total while no client answers', async () => {
    fetchDownloadQueue.mockResolvedValue({
      ...QUEUE,
      clients: QUEUE.clients.map((client) => ({ ...client, isReachable: false })),
    });

    renderInAnAddress(<DownloadsPanel />);

    await screen.findByText('Dune');

    expect(screen.queryByText(/MB\/s/)).not.toBeInTheDocument();
  });

  it('pauses and resumes a download, saying why where it could not', async () => {
    resumeQueuedDownload.mockResolvedValue({
      value: null,
      refusal: { message: 'qBittorrent could not be reached' },
    });

    const user = userEvent.setup();

    renderInAnAddress(<DownloadsPanel />);

    await choose(user, 'Dune', /Pause/);

    await waitFor(() => {
      expect(pauseQueuedDownload).toHaveBeenCalledWith(DOWNLOAD.id);
    });

    fetchDownloadQueue.mockResolvedValue({
      ...QUEUE,
      downloads: [{ ...DOWNLOAD, state: 'paused' }],
    });
    await waitFor(() => {
      expect(fetchDownloadQueue).toHaveBeenCalledTimes(2);
    });
    act(() => {
      heard.onQueue?.({ ...QUEUE, downloads: [{ ...DOWNLOAD, state: 'paused' }] });
    });

    await choose(user, 'Dune', /Resume/);

    expect(await screen.findByRole('alert')).toHaveTextContent('qBittorrent could not be reached');
  });

  it('removes a download, deleting what it downloaded where asked', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<DownloadsPanel />);

    await choose(user, 'Dune', /Remove/);
    await user.click(await screen.findByRole('checkbox', { name: /Delete what it downloaded/ }));
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(removeQueuedDownload).toHaveBeenCalledWith(DOWNLOAD.id, true);
    });
  });

  it('offers no choice of files for a download NZBGet has finished', async () => {
    fetchDownloadQueue.mockResolvedValue({
      ...QUEUE,
      downloads: [{ ...DOWNLOAD, clientId: NZBGET.id, clientName: 'NZBGet', state: 'done' }],
    });

    const user = userEvent.setup();

    renderInAnAddress(<DownloadsPanel />);

    await choose(user, 'Dune', /Remove/);

    expect(await screen.findByText(/NZBGet keeps what it has finished with/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(removeQueuedDownload).not.toHaveBeenCalled();
  });

  it('lists the clients on their own tab, and tests one', async () => {
    testDownloadClient.mockResolvedValueOnce({
      value: { isWorking: false, problem: null, version: null },
      refusal: null,
    });
    testDownloadClient.mockResolvedValueOnce({
      value: { isWorking: false, problem: 'refused the password', version: null },
      refusal: null,
    });
    testDownloadClient.mockResolvedValueOnce({
      value: null,
      refusal: { message: 'Requesting is off.' },
    });

    const user = userEvent.setup();

    renderInAnAddress(<DownloadsPanel />);

    await user.click(screen.getByRole('tab', { name: 'Clients' }));

    expect(await screen.findByText('http://qbittorrent:8080')).toBeInTheDocument();

    await choose(user, 'qBittorrent', /Test/);

    expect(await screen.findByRole('alert')).toHaveTextContent('qBittorrent: did not answer');

    await choose(user, 'qBittorrent', /Test/);

    expect(await screen.findByText('qBittorrent: refused the password')).toBeInTheDocument();

    await choose(user, 'qBittorrent', /Test/);

    expect(await screen.findByText('Requesting is off.')).toBeInTheDocument();
  });

  it('switches a client off, and says why where it could not', async () => {
    changeDownloadClient.mockResolvedValueOnce({ value: null, refusal: { message: 'No.' } });

    const user = userEvent.setup();

    renderInAnAddress(<DownloadsPanel />);

    await user.click(screen.getByRole('tab', { name: 'Clients' }));
    await choose(user, 'qBittorrent', /Switch off/);

    expect(changeDownloadClient).toHaveBeenCalledWith(CLIENT.id, { isEnabled: false });
    expect(await screen.findByRole('alert')).toHaveTextContent('No.');
  });

  it('removes a client once that is confirmed, saying why where it could not', async () => {
    removeDownloadClient.mockResolvedValueOnce({ message: 'The service could not be heard.' });

    const user = userEvent.setup();

    renderInAnAddress(<DownloadsPanel />);

    await user.click(screen.getByRole('tab', { name: 'Clients' }));
    await choose(user, 'qBittorrent', /Remove/);

    expect(await screen.findByText('Remove qBittorrent?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(removeDownloadClient).toHaveBeenCalledWith(CLIENT.id);
    expect(await screen.findByRole('alert')).toHaveTextContent('The service could not be heard.');
  });

  it('keeps a client its removal was cancelled for', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<DownloadsPanel />);

    await user.click(screen.getByRole('tab', { name: 'Clients' }));
    await choose(user, 'qBittorrent', /Remove/);
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(removeDownloadClient).not.toHaveBeenCalled();
  });

  it('opens the client dialog to add one, or to change one', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<DownloadsPanel />);

    await user.click(screen.getByRole('button', { name: 'Add a client' }));

    expect(await screen.findByText('Add a download client')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await user.click(screen.getByRole('tab', { name: 'Clients' }));
    await choose(user, 'qBittorrent', /Change/);

    expect(await screen.findByText('Change qBittorrent')).toBeInTheDocument();
  });

  it('says it could not read the queue or the clients, and tries again', async () => {
    fetchDownloadQueue.mockRejectedValue(new Error('offline'));
    fetchDownloadClients.mockRejectedValue(new Error('offline'));

    const user = userEvent.setup();

    renderInAnAddress(<DownloadsPanel />);

    await user.click(await screen.findByRole('button', { name: /try again/i }));

    expect(fetchDownloadQueue).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole('tab', { name: 'Clients' }));
    await user.click(await screen.findByRole('button', { name: /try again/i }));

    expect(fetchDownloadClients).toHaveBeenCalledTimes(2);
  });

  it('says it is reading while nothing has arrived yet', async () => {
    fetchDownloadQueue.mockReturnValue(new Promise(() => undefined));
    fetchDownloadClients.mockReturnValue(new Promise(() => undefined));

    const user = userEvent.setup();

    renderInAnAddress(<DownloadsPanel />);

    expect(screen.getByRole('status', { name: 'Reading the downloads' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Clients' }));

    expect(
      await screen.findByRole('status', { name: 'Reading the download clients' }),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadsPanel.displayName).toBe('DownloadsPanel');
  });
});
