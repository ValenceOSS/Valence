import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EpisodeNumberDialog } from './EpisodeNumberDialog';

const { pinning } = vi.hoisted(() => ({
  pinning: vi.fn(() => Promise.resolve({ kind: 'reached', count: 1, jobId: 'job' })),
}));

vi.mock('@ValenceClient/admin/pinEpisode', () => ({ pinEpisode: pinning }));

describe('EpisodeNumberDialog', () => {
  it('says which episodes a file holds, and follows the job reading it again', async () => {
    const onChanged = vi.fn();
    const user = userEvent.setup();

    render(
      <EpisodeNumberDialog
        mediaId="file"
        season={1}
        episode={3}
        isOpen
        onClose={vi.fn()}
        onChanged={onChanged}
      />,
    );

    await user.type(screen.getByLabelText('Last episode, for a file of several'), '4');
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledWith('job');
    });
    expect(pinning).toHaveBeenCalledWith('file', {
      seasonNumber: 1,
      episodeNumber: 3,
      episodeNumberEnd: 4,
    });
  });

  it('refuses a last episode before the first, and goes by the file name again', async () => {
    const user = userEvent.setup();

    render(
      <EpisodeNumberDialog
        mediaId="file"
        season={1}
        episode={3}
        isOpen
        onClose={vi.fn()}
        onChanged={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Last episode, for a file of several'), '2');

    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Go by the file name again' }));

    await waitFor(() => {
      expect(pinning).toHaveBeenLastCalledWith('file', null);
    });
  });
});
