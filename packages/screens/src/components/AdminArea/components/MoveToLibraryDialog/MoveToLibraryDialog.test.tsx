import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { MoveToLibraryDialog } from './MoveToLibraryDialog';

const { moving } = vi.hoisted(() => ({
  moving: vi.fn(() => Promise.resolve({ files: 1, jobId: 'job' })),
}));

vi.mock('@ValenceClient/library/fetchLibrary', () => ({ moveMedia: moving }));

const FILMS = aLibrary({ id: 'films', name: 'Films', kind: 'movies' });
const SHOWS = aLibrary({ id: 'shows', name: 'Shows', kind: 'shows' });
const MORE_FILMS = aLibrary({ id: 'more-films', name: 'More films', kind: 'movies' });

describe('MoveToLibraryDialog', () => {
  it('starts on another library of the same kind, never its own, and moves there', async () => {
    const onMoved = vi.fn();
    const user = userEvent.setup();

    render(
      <MoveToLibraryDialog
        target={{ items: [aMediaSummary({ id: 'film' })], name: 'A film', libraryId: 'films' }}
        libraries={[FILMS, SHOWS, MORE_FILMS]}
        onClose={vi.fn()}
        onMoved={onMoved}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Move' }));

    await waitFor(() => {
      expect(onMoved).toHaveBeenCalledWith('more-films', 'job');
    });
    expect(moving).toHaveBeenCalledWith(['film'], 'more-films');
  });
});
