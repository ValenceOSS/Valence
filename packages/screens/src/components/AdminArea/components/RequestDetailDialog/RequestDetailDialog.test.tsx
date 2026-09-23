import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { RequestDetailDialog } from './RequestDetailDialog';
import type * as Requests from '@ValenceClient/requests/fetchMediaRequests';
import type * as Queue from '@ValenceClient/requests/fetchDownloadQueue';

const fetchMediaRequestLog = vi.fn<typeof Requests.fetchMediaRequestLog>();
const fetchRequestBlocklist = vi.fn<typeof Requests.fetchRequestBlocklist>();
const liftRequestBlock = vi.fn<typeof Requests.liftRequestBlock>();
const fetchDownloadQueue = vi.fn<typeof Queue.fetchDownloadQueue>();

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  fetchMediaRequestLog: (id: string) => fetchMediaRequestLog(id),
  fetchRequestBlocklist: (id: string) => fetchRequestBlocklist(id),
  liftRequestBlock: (...given: Parameters<typeof Requests.liftRequestBlock>) =>
    liftRequestBlock(...given),
  fetchMediaRequestReleases: () =>
    Promise.resolve({ releases: [], indexers: [], judgements: [], pickedId: null }),
  pickMediaRelease: vi.fn(),
}));

vi.mock('@ValenceClient/requests/fetchDownloadQueue', () => ({
  fetchDownloadQueue: () => fetchDownloadQueue(),
  pauseQueuedDownload: vi.fn(),
  resumeQueuedDownload: vi.fn(),
  removeQueuedDownload: vi.fn(),
  fileQueuedDownload: vi.fn(),
}));

const DOWNLOAD_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const DUNE = aMediaRequest({
  state: 'downloading',
  items: [
    {
      id: '1c6a7e2b-3d4f-4a5b-9c8d-7e6f5a4b3c2d',
      musicBrainzId: null,
      season: null,
      episode: null,
      title: 'Dune',
      airDate: null,
      state: 'downloading',
      problem: null,
      problemCode: null,
      releaseTitle: 'Dune.2021.2160p.WEB-DL',
      downloadId: DOWNLOAD_ID,
      filePath: null,
      score: 420,
      downloadedBytes: null,
      downloadSeconds: null,
      lastSearchedAt: null,
      updatedAt: '2026-09-19T00:00:00.000Z',
    },
  ],
});

beforeEach(() => {
  fetchMediaRequestLog
    .mockReset()
    .mockResolvedValue([
      { id: 1, at: '2026-09-19T00:00:00.000Z', message: 'Searched for it.', problemCode: null },
    ]);
  fetchRequestBlocklist.mockReset().mockResolvedValue([
    {
      id: '9f2504e0-4f89-41d3-9a0c-0305e82c3309',
      requestId: DUNE.id,
      title: 'Dune.2021.2160p.BAD',
      indexerId: null,
      reason: 'It stalled',
      at: '2026-09-19T00:00:00.000Z',
    },
  ]);
  fetchDownloadQueue.mockReset().mockResolvedValue({
    clients: [],
    checkedAt: null,
    downloads: [
      {
        id: DOWNLOAD_ID,
        clientId: '0f8fad5b-d9cb-469f-a165-70867728950e',
        clientName: 'qBittorrent',
        protocol: 'torrent',
        libraryKind: 'movies',
        title: 'Dune.2021.2160p.WEB-DL',
        indexerName: 'Nyaa.si',
        state: 'downloading',
        problem: null,
        problemCode: null,
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
        filingProblemCode: null,
      },
    ],
  });
});

describe('RequestDetailDialog', () => {
  it('shows what was chosen and what is coming down for it', async () => {
    renderInAnAddress(<RequestDetailDialog request={DUNE} onClose={vi.fn()} onChanged={vi.fn()} />);

    expect(await screen.findByText('scored 420')).toBeInTheDocument();
    expect(screen.getAllByText('Dune.2021.2160p.WEB-DL').length).toBeGreaterThan(1);
    expect(await screen.findByRole('table', { name: 'Downloads' })).toBeInTheDocument();
  });

  it('shows what it has done, and what it will never try again', async () => {
    const user = userEvent.setup();

    renderInAnAddress(
      <RequestDetailDialog request={DUNE} openOn="history" onClose={vi.fn()} onChanged={vi.fn()} />,
    );

    expect(await screen.findByText('Searched for it.')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Never again' }));

    expect(await screen.findByText('Dune.2021.2160p.BAD')).toBeInTheDocument();
  });

  it('links a line of its history to the docs about its problem, where it has one', async () => {
    fetchMediaRequestLog.mockResolvedValue([
      {
        id: 2,
        at: '2026-09-19T00:05:00.000Z',
        message: 'Could not be filed.',
        problemCode: 'MayNotWriteToLibrary',
      },
      { id: 1, at: '2026-09-19T00:00:00.000Z', message: 'Searched for it.', problemCode: null },
    ]);

    renderInAnAddress(
      <RequestDetailDialog request={DUNE} openOn="history" onClose={vi.fn()} onChanged={vi.fn()} />,
    );

    expect(await screen.findByText('Could not be filed.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'How to fix this' })).toHaveLength(1);
  });

  it('lets a release it gave up on be tried again', async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();

    liftRequestBlock.mockResolvedValue(null);

    renderInAnAddress(
      <RequestDetailDialog
        request={DUNE}
        openOn="blocked"
        onClose={vi.fn()}
        onChanged={onChanged}
      />,
    );

    await user.click(await screen.findByRole('button', { name: 'Try it again' }));

    await waitFor(() => {
      expect(liftRequestBlock).toHaveBeenCalledWith(
        DUNE.id,
        '9f2504e0-4f89-41d3-9a0c-0305e82c3309',
      );
    });
    expect(onChanged).toHaveBeenCalled();
  });

  it('shows nothing at all while it is closed', () => {
    renderInAnAddress(<RequestDetailDialog request={null} onClose={vi.fn()} onChanged={vi.fn()} />);

    expect(screen.queryByRole('tab', { name: 'How it is going' })).not.toBeInTheDocument();
  });
});
