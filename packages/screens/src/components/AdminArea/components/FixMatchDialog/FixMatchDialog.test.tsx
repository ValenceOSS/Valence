import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { FixMatchDialog } from './FixMatchDialog';
import type { MatchPreview } from '@ValenceContracts/schemas/TitleEdit';

const { search, correct, forget, previewOf, filesOf } = vi.hoisted(() => ({
  filesOf: vi.fn(),
  search: vi.fn(),
  correct: vi.fn(),
  forget: vi.fn(),
  previewOf: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchTitleCandidates', () => ({ fetchTitleCandidates: search }));
vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  correctMatch: correct,
  forgetCorrection: forget,
}));
vi.mock('@ValenceClient/admin/fetchMatchPreview', () => ({ fetchMatchPreview: previewOf }));
vi.mock('@ValenceClient/admin/fetchTitleFiles', () => ({ fetchTitleFiles: filesOf }));
vi.mock('@ValenceUI/notify', () => ({ notify: { worked: vi.fn(), failed: vi.fn() } }));

const FILM = aMediaSummary({ id: '00000000-0000-4000-8000-000000000001', title: 'A wrong film' });

const PREVIEW: MatchPreview = {
  kind: 'film',
  posterUrl: null,
  backdropUrl: null,
  rows: [
    {
      field: 'title',
      current: { value: 'A wrong film', source: 'catalogue' },
      next: 'The right film',
    },
    {
      field: 'tagline',
      current: { value: 'My tagline', source: 'edited', catalogue: null },
      next: 'Their tagline',
    },
    { field: 'genres', current: { value: ['Drama'], source: 'catalogue' }, next: ['Drama'] },
  ],
};

/**
 * Opens the dialog on a film.
 *
 * @returns What it was told.
 */
const opened = () => {
  const told = { onClose: vi.fn(), onCorrected: vi.fn() };

  render(
    <QueryClientProvider client={new QueryClient()}>
      <FixMatchDialog media={FILM} {...told} />
    </QueryClientProvider>,
  );

  return told;
};

beforeEach(() => {
  vi.clearAllMocks();
  search.mockResolvedValue({
    matches: [
      {
        externalId: '604',
        kind: 'movie',
        title: 'The right film',
        year: 1999,
        overview: null,
        posterUrl: null,
      },
    ],
    hasMore: true,
    total: 134,
  });
  previewOf.mockResolvedValue(PREVIEW);
  correct.mockResolvedValue({ corrected: 1, jobId: 'job' });
});

describe('FixMatchDialog', () => {
  it('searches under the title’s name as soon as it opens', async () => {
    opened();

    expect(await screen.findByRole('button', { name: /The right film/u })).toBeInTheDocument();
    expect(search).toHaveBeenCalledWith('A wrong film', 'movie');
    expect(screen.getByText('A wrong film · Step 1 of 2: Find')).toBeInTheDocument();
  });

  it('compares the chosen entry, ticking changes but not edits, and keeps what is left unticked', async () => {
    const user = userEvent.setup();
    const told = opened();

    await user.click(await screen.findByRole('button', { name: /The right film/u }));

    expect(await screen.findByText('Their tagline')).toBeInTheDocument();
    expect(previewOf).toHaveBeenCalledWith(FILM.id, '604', 'movie');
    expect(screen.getByRole('checkbox', { name: 'Take the new Title' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Take the new Tagline' })).not.toBeChecked();
    expect(screen.queryByText('Genres')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(correct).toHaveBeenCalledWith(FILM.id, '604', 'movie', ['tagline']);
    });
    expect(told.onCorrected).toHaveBeenCalledWith('job');
    expect(told.onClose).toHaveBeenCalled();
  });

  it('shows unchanged fields on asking, and goes back to the search', async () => {
    const user = userEvent.setup();

    opened();

    await user.click(await screen.findByRole('button', { name: /The right film/u }));
    await user.click(await screen.findByRole('switch', { name: 'Show unchanged' }));

    expect(screen.getByText('Genres')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(await screen.findByText('A wrong film · Step 1 of 2: Find')).toBeInTheDocument();
  });

  it('scores each entry, says how many there are, and lists the next page on asking', async () => {
    const user = userEvent.setup();

    opened();

    expect(await screen.findByText('Showing 1 of 134')).toBeInTheDocument();
    expect(screen.getByText(/^\d+%$/u)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show more' }));

    expect(search).toHaveBeenLastCalledWith('A wrong film', 'movie', 2);
    expect(await screen.findByText('Showing 2 of 134')).toBeInTheDocument();
  });

  it('says what found nothing, and searches again without the year', async () => {
    const user = userEvent.setup();

    search.mockResolvedValue({ matches: [], hasMore: false, total: 0 });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <FixMatchDialog
          media={{ ...FILM, title: 'A wrong film 2001' }}
          onClose={vi.fn()}
          onCorrected={vi.fn()}
        />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText('Nothing came back for “A wrong film 2001”.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try without the year' }));

    expect(search).toHaveBeenLastCalledWith('A wrong film', 'movie');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FixMatchDialog.displayName).toBe('FixMatchDialog');
  });

  it('names the file being matched, so two films of one name can be told apart', async () => {
    filesOf.mockResolvedValue({ files: [FILM], paths: { [FILM.id]: '/films/A (2020)/A.mkv' } });
    search.mockResolvedValue({ matches: [], hasMore: false, total: 0 });

    opened();

    expect(await screen.findByText('/films/A (2020)/A.mkv')).toBeInTheDocument();
  });
});
