import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { RefreshTitleDialog } from './RefreshTitleDialog';

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));

vi.mock('@ValenceClient/admin/refreshTitle', () => ({ refreshTitle: refresh }));
vi.mock('@ValenceUI/notify', () => ({ notify: { worked: vi.fn(), failed: vi.fn() } }));

/**
 * Opens the dialog on a film.
 *
 * @param isMatched - Whether the film is matched.
 * @returns What it was told.
 */
const opened = (isMatched = true) => {
  const told = { onClose: vi.fn(), onStarted: vi.fn() };

  render(
    <RefreshTitleDialog
      mediaId="film"
      name="Film"
      kind="film"
      isMatched={isMatched}
      isOpen
      {...told}
    />,
    { wrapper: CacheScope },
  );

  return told;
};

beforeEach(() => {
  vi.clearAllMocks();
  refresh.mockResolvedValue({ kind: 'reached', count: 1, jobId: 'job' });
});

describe('RefreshTitleDialog', () => {
  it('updates the details by default, and follows the job doing it', async () => {
    const told = opened();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(refresh).toHaveBeenCalledWith('film', 'details', []);
    });
    expect(told.onStarted).toHaveBeenCalledWith('job');
    expect(told.onClose).toHaveBeenCalled();
  });

  it('asks again for only the fields ticked', async () => {
    const user = userEvent.setup();

    opened();
    await user.click(screen.getByText('Update some fields'));
    await user.click(screen.getByRole('checkbox', { name: 'Genres' }));
    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    await waitFor(() => {
      expect(refresh).toHaveBeenCalledWith('film', 'fields', ['genres', 'rating']);
    });
  });

  it('says why an unmatched title has no fields to ask for again', () => {
    opened(false);

    expect(
      screen.getByText('Only a title matched to TMDB has fields to ask for again.'),
    ).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RefreshTitleDialog.displayName).toBe('RefreshTitleDialog');
  });
});
