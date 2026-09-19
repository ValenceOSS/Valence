import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { DownloadQueueTable } from './DownloadQueueTable';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';

/**
 * A download, with anything the test cares about changed.
 */
const aDownload = (overrides: Partial<QueuedDownload> = {}): QueuedDownload => ({
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  clientId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  clientName: 'qBittorrent',
  protocol: 'torrent',
  libraryKind: 'movies',
  title: 'Dune',
  indexerName: 'Jackett',
  state: 'downloading',
  problem: null,
  progress: 0.456,
  sizeBytes: 4 * 1024 ** 3,
  doneBytes: 2 * 1024 ** 3,
  downloadBytesPerSecond: 1024 ** 2,
  uploadBytesPerSecond: 40 * 1024,
  secondsLeft: 12 * 60,
  seeds: 9,
  peers: 2,
  sentAt: '2026-09-19T00:00:00.000Z',
  finishedAt: null,
  ...overrides,
});

/**
 * The table over the downloads given.
 */
const show = (downloads: QueuedDownload[], busyId: string | null = null) => {
  const handlers = { onPause: vi.fn(), onResume: vi.fn(), onRemove: vi.fn() };

  renderInAnAddress(<DownloadQueueTable downloads={downloads} busyId={busyId} {...handlers} />);

  return handlers;
};

/**
 * The row naming a release.
 */
const rowOf = (title: string) =>
  screen.getAllByRole('row').find((row) => row.textContent.includes(title)) ?? document.body;

describe('DownloadQueueTable', () => {
  it('shows how a download is doing, how much has arrived, and how fast', () => {
    show([aDownload()]);

    const row = within(rowOf('Dune'));

    expect(row.getByText('Films · qBittorrent · Jackett')).toBeInTheDocument();
    expect(row.getByText('Downloading')).toBeInTheDocument();
    expect(row.getByText('45%')).toBeInTheDocument();
    expect(row.getByText('2.0 GB of 4.0 GB')).toBeInTheDocument();
    expect(row.getByText('↓ 1.0 MB/s · ↑ 40 KB/s')).toBeInTheDocument();
    expect(row.getByText('12 min')).toBeInTheDocument();
    expect(row.getByText('9 seeding · 2 fetching')).toBeInTheDocument();
    expect(
      row.getByRole('progressbar', { name: 'How much of Dune has arrived' }),
    ).toBeInTheDocument();
  });

  it('shows what it knows of a usenet download, and dashes for the rest', () => {
    show([
      aDownload({
        protocol: 'usenet',
        libraryKind: 'shows',
        clientName: 'SABnzbd',
        indexerName: null,
        state: 'done',
        progress: 1,
        uploadBytesPerSecond: null,
        downloadBytesPerSecond: null,
        secondsLeft: null,
        seeds: null,
        peers: null,
        problem: 'NZBGet finished it with a warning (WARNING/SCRIPT)',
      }),
    ]);

    const row = within(rowOf('Dune'));

    expect(row.getByText('Series · SABnzbd')).toBeInTheDocument();
    expect(row.getByText('4.0 GB')).toBeInTheDocument();
    expect(row.getByText(/finished it with a warning/)).toBeInTheDocument();
    expect(row.getAllByText('—')).toHaveLength(3);
  });

  it('shows what has arrived where the size is not known yet, or nothing has', () => {
    show([
      aDownload({
        id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
        title: 'Part',
        sizeBytes: null,
        doneBytes: 1024,
      }),
      aDownload({
        id: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
        title: 'Blank',
        sizeBytes: null,
        doneBytes: null,
      }),
      aDownload({ id: '6ba7b813-9dad-11d1-80b4-00c04fd430c8', title: 'Sized', doneBytes: null }),
      aDownload({
        id: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
        title: 'Lonely',
        seeds: null,
        peers: 3,
      }),
    ]);

    expect(within(rowOf('Part')).getByText('1.0 KB')).toBeInTheDocument();
    expect(within(rowOf('Sized')).getByText('4.0 GB')).toBeInTheDocument();
    expect(within(rowOf('Lonely')).getByText('0 seeding · 3 fetching')).toBeInTheDocument();
  });

  it('pauses a download that is going, and resumes one that is paused', async () => {
    const user = userEvent.setup();
    const { onPause, onResume } = show([
      aDownload(),
      aDownload({ id: '6ba7b815-9dad-11d1-80b4-00c04fd430c8', title: 'Heat', state: 'paused' }),
    ]);

    await user.click(screen.getByRole('button', { name: 'Actions for Dune' }));
    await user.click(await screen.findByRole('menuitem', { name: /Pause/ }));

    expect(onPause).toHaveBeenCalledWith(expect.objectContaining({ title: 'Dune' }));

    await user.click(screen.getByRole('button', { name: 'Actions for Heat' }));
    await user.click(await screen.findByRole('menuitem', { name: /Resume/ }));

    expect(onResume).toHaveBeenCalledWith(expect.objectContaining({ title: 'Heat' }));
  });

  it('offers only removal for a download that has finished or failed', async () => {
    const user = userEvent.setup();
    const { onRemove } = show([aDownload({ state: 'failed' })]);

    await user.click(screen.getByRole('button', { name: 'Actions for Dune' }));

    expect(screen.queryByRole('menuitem', { name: /Pause|Resume/ })).not.toBeInTheDocument();

    await user.click(await screen.findByRole('menuitem', { name: /Remove/ }));

    expect(onRemove).toHaveBeenCalled();
  });

  it('waits on a download that is being acted on', () => {
    show([aDownload()], aDownload().id);

    expect(screen.getByRole('status', { name: 'Working on Dune' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Actions for Dune' })).not.toBeInTheDocument();
  });

  it('says where downloads come from while there are none', () => {
    show([]);

    expect(screen.getByText(/Send a release from Search/)).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadQueueTable.displayName).toBe('DownloadQueueTable');
  });
});
