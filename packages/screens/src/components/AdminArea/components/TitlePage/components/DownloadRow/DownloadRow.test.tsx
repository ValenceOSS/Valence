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
    id: 'd1',
    clientId: '6ba7b810-9dad-11d1-80b4-000000000200',
    clientName: 'qBittorrent',
    protocol: 'torrent',
    libraryKind: 'shows',
    title: 'Show.S04.1080p.WEB-DL',
    indexerName: 'Indexer A',
    state: 'downloading',
    problem: null,
    problemCode: null,
    progress: 0.42,
    sizeBytes: 2_000_000_000,
    doneBytes: 840_000_000,
    downloadBytesPerSecond: 1,
    uploadBytesPerSecond: null,
    secondsLeft: 600,
    seeds: 3,
    peers: 4,
    sentAt: '2026-01-01T00:00:00.000Z',
    finishedAt: null,
    filedInto: null,
    filingProblem: null,
    filingProblemCode: null,
  },
};

describe('DownloadRow', () => {
  it('says how far along a download is, what it holds and where it came from', () => {
    render(
      <ul>
        <DownloadRow download={DOWNLOAD} onStop={vi.fn()} />
      </ul>,
    );

    expect(screen.getByText('Show.S04.1080p.WEB-DL')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByText('2 episodes')).toBeInTheDocument();
    expect(screen.getByText('Indexer A')).toBeInTheDocument();
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

  it('sets a display name so devtools can identify it', () => {
    expect(DownloadRow.displayName).toBe('DownloadRow');
  });
});
