import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChosenDownloadsBar } from './ChosenDownloadsBar';
import type { QueuedDownload } from '@ValenceContracts/schemas/DownloadQueue';
import type { ChosenDownloadsBarProps } from './ChosenDownloadsBar.types';

const aDownload = (id: string, state: QueuedDownload['state']): QueuedDownload => ({
  id,
  clientId: '0f8fad5b-d9cb-469f-a165-70867728950e',
  clientName: 'qBittorrent',
  protocol: 'torrent',
  libraryKind: 'music',
  title: id,
  indexerName: null,
  state,
  problem: null,
  problemCode: null,
  progress: 0,
  sizeBytes: null,
  doneBytes: null,
  downloadBytesPerSecond: null,
  uploadBytesPerSecond: null,
  secondsLeft: null,
  seeds: null,
  peers: null,
  sentAt: '2026-10-04T00:00:00.000Z',
  finishedAt: null,
  filedInto: null,
  filingProblem: null,
  filingProblemCode: null,
  wasPaused: false,
});

const draw = (overrides: Partial<ChosenDownloadsBarProps> = {}) => {
  const handlers = { onPause: vi.fn(), onResume: vi.fn(), onRemove: vi.fn(), onClear: vi.fn() };

  render(<ChosenDownloadsBar total={6} chosen={[]} isBusy={false} {...handlers} {...overrides} />);

  return handlers;
};

describe('ChosenDownloadsBar', () => {
  it('says how many downloads there are while none are ticked, and offers nothing to do', () => {
    draw();

    expect(screen.getByText('6 downloads')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('pauses, removes and unticks the ones ticked', async () => {
    const handlers = draw({
      chosen: [aDownload('Xscape', 'queued'), aDownload('Standards', 'queued')],
    });

    expect(screen.getByText('2 selected')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));

    expect(handlers.onPause).toHaveBeenCalled();
    expect(handlers.onRemove).toHaveBeenCalled();
    expect(handlers.onClear).toHaveBeenCalled();
  });

  it('offers to resume only where one ticked is paused, and to pause only where one can be', async () => {
    const handlers = draw({ chosen: [aDownload('Xscape', 'paused'), aDownload('Bad', 'done')] });

    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Resume' }));

    expect(handlers.onResume).toHaveBeenCalled();
  });

  it('waits while they are being acted on', () => {
    draw({ chosen: [aDownload('Xscape', 'queued')], isBusy: true });

    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ChosenDownloadsBar.displayName).toBe('ChosenDownloadsBar');
  });
});
