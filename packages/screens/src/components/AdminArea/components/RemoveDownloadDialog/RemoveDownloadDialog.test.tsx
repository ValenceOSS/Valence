import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RemoveDownloadDialog } from './RemoveDownloadDialog';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';

const DUNE: QueuedDownload = {
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  clientId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  clientName: 'qBittorrent',
  protocol: 'torrent',
  libraryKind: 'movies',
  title: 'Dune',
  indexerName: null,
  state: 'done',
  problem: null,
  problemCode: null,
  progress: 1,
  sizeBytes: 100,
  doneBytes: 100,
  downloadBytesPerSecond: null,
  uploadBytesPerSecond: null,
  secondsLeft: null,
  seeds: null,
  peers: null,
  sentAt: '2026-09-19T00:00:00.000Z',
  finishedAt: '2026-09-19T01:00:00.000Z',
  filedInto: null,
  filingProblem: null,
  filingProblemCode: null,
  wasPaused: false,
};

describe('RemoveDownloadDialog', () => {
  it('removes a download, keeping what it downloaded unless told otherwise', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(<RemoveDownloadDialog downloads={[DUNE]} onClose={vi.fn()} onConfirm={onConfirm} />);

    expect(screen.getByText(/removed from qBittorrent/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onConfirm).toHaveBeenLastCalledWith(false);

    await user.click(screen.getByRole('checkbox', { name: 'Also delete downloaded files' }));
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onConfirm).toHaveBeenLastCalledWith(true);
  });

  it('offers no choice a client would not honour', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <RemoveDownloadDialog
        downloads={[{ ...DUNE, clientName: 'NZBGet' }]}
        keepsFinishedFiles
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByText(/NZBGet doesn’t delete finished downloads/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onConfirm).toHaveBeenCalledWith(false);
  });

  it('forgets the choice when it opens on another download', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const { rerender } = render(
      <RemoveDownloadDialog downloads={[DUNE]} onClose={vi.fn()} onConfirm={onConfirm} />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Also delete downloaded files' }));

    rerender(
      <RemoveDownloadDialog
        downloads={[{ ...DUNE, id: '0f8fad5b-d9cb-469f-a165-70867728950f', title: 'Heat' }]}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.getByRole('checkbox', { name: 'Also delete downloaded files' }),
    ).not.toBeChecked();
  });

  it('can be closed without removing anything', async () => {
    const onClose = vi.fn();

    render(<RemoveDownloadDialog downloads={[DUNE]} onClose={onClose} onConfirm={vi.fn()} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('shows nothing while nothing is being removed', () => {
    render(<RemoveDownloadDialog downloads={[]} onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RemoveDownloadDialog.displayName).toBe('RemoveDownloadDialog');
  });

  it('removes several downloads together, asking once whether what they downloaded goes too', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <RemoveDownloadDialog
        downloads={[DUNE, { ...DUNE, id: '0f8fad5b-d9cb-469f-a165-70867728950f', title: 'Heat' }]}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Remove 2 downloads' })).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Also delete downloaded files' }));
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onConfirm).toHaveBeenCalledWith(true);
  });
});
