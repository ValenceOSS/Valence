import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { DownloadRow } from './DownloadRow';
import type { RequestDownload } from '@ValenceClient/requests/downloadsOfRequest';

const DOWNLOAD: RequestDownload = {
  downloadId: 'd1',
  releaseTitle: 'Show.S04.1080p.WEB-DL',
  items: [aRequestItem({ id: 'a' }), aRequestItem({ id: 'b', episode: 2 })],
  queued: {
    state: 'downloading',
    wasPaused: false,
    clientName: 'qBittorrent',
    indexerName: 'Indexer A',
    progress: 0.42,
    sizeBytes: 2_000_000_000,
    downloadBytesPerSecond: 3_145_728,
    uploadBytesPerSecond: 1024,
    secondsLeft: 600,
    sentAt: '2026-01-01T00:00:00.000Z',
  },
};

describe('DownloadRow', () => {
  it('says how far along a download is, how fast, what it holds and where it came from', () => {
    render(
      <ul>
        <DownloadRow download={DOWNLOAD} onStop={vi.fn()} />
      </ul>,
    );

    expect(screen.getByText('Show.S04.1080p.WEB-DL')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByText('2 episodes')).toBeInTheDocument();
    expect(screen.getByText('Indexer A')).toBeInTheDocument();
    expect(screen.getByText('↓ 3.0 MB/s')).toBeInTheDocument();
    expect(screen.getByText('↑ 1.0 KB/s')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /Show.S04/ })).toBeInTheDocument();
  });

  it('is stopped from its cross', async () => {
    const onStop = vi.fn();

    render(
      <ul>
        <DownloadRow download={{ ...DOWNLOAD, queued: null }} onStop={onStop} />
      </ul>,
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'Stop download…' }));

    expect(onStop).toHaveBeenCalledWith(expect.objectContaining({ downloadId: 'd1' }));
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('says a release was picked by hand', () => {
    render(
      <DownloadRow
        download={{ ...DOWNLOAD, items: [aRequestItem({ id: 'a', isPickedByHand: true })] }}
        onStop={vi.fn()}
      />,
    );

    expect(screen.getByText('Picked by hand')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadRow.displayName).toBe('DownloadRow');
  });
});
