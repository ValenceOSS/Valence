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
};

describe('RemoveDownloadDialog', () => {
  it('removes a download, keeping what it downloaded unless told otherwise', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(<RemoveDownloadDialog download={DUNE} onClose={vi.fn()} onConfirm={onConfirm} />);

    expect(screen.getByText(/taken out of qBittorrent/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onConfirm).toHaveBeenLastCalledWith(false);

    await user.click(screen.getByRole('checkbox', { name: 'Delete what it downloaded as well' }));
    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onConfirm).toHaveBeenLastCalledWith(true);
  });

  it('offers no choice a client would not honour', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <RemoveDownloadDialog
        download={{ ...DUNE, clientName: 'NZBGet' }}
        keepsFinishedFiles
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByText(/NZBGet keeps what it has finished with/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onConfirm).toHaveBeenCalledWith(false);
  });

  it('forgets the choice when it opens on another download', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const { rerender } = render(
      <RemoveDownloadDialog download={DUNE} onClose={vi.fn()} onConfirm={onConfirm} />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Delete what it downloaded as well' }));

    rerender(
      <RemoveDownloadDialog
        download={{ ...DUNE, id: '0f8fad5b-d9cb-469f-a165-70867728950f', title: 'Heat' }}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.getByRole('checkbox', { name: 'Delete what it downloaded as well' }),
    ).not.toBeChecked();
  });

  it('can be closed without removing anything', async () => {
    const onClose = vi.fn();

    render(<RemoveDownloadDialog download={DUNE} onClose={onClose} onConfirm={vi.fn()} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('shows nothing while nothing is being removed', () => {
    render(<RemoveDownloadDialog download={null} onClose={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RemoveDownloadDialog.displayName).toBe('RemoveDownloadDialog');
  });
});
