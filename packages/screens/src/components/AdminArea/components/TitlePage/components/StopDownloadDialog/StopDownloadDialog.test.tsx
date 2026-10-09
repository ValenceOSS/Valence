import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { StopDownloadDialog } from './StopDownloadDialog';

const DOWNLOAD = { downloadId: 'd1', releaseTitle: 'Film.2021.720p', items: [], queued: null };

describe('StopDownloadDialog', () => {
  it('looks for a different release by default, deleting what it had', async () => {
    const onStop = vi.fn();

    render(
      <StopDownloadDialog
        download={DOWNLOAD}
        isStopping={false}
        onClose={vi.fn()}
        onStop={onStop}
      />,
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'Stop it' }));

    expect(onStop).toHaveBeenCalledWith('another', true);
  });

  it('stops getting it, keeping what it had, where asked', async () => {
    const onStop = vi.fn();
    const user = userEvent.setup();

    render(
      <StopDownloadDialog
        download={DOWNLOAD}
        isStopping={false}
        onClose={vi.fn()}
        onStop={onStop}
      />,
    );
    await user.click(screen.getByRole('radio', { name: /Stop getting this/ }));
    await user.click(screen.getByRole('checkbox', { name: /Delete what it downloaded/ }));
    await user.click(screen.getByRole('button', { name: 'Stop it' }));

    expect(onStop).toHaveBeenCalledWith('nothing', false);
  });

  it('is shut while there is nothing to stop', () => {
    render(
      <StopDownloadDialog download={null} isStopping={false} onClose={vi.fn()} onStop={vi.fn()} />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StopDownloadDialog.displayName).toBe('StopDownloadDialog');
  });
});
