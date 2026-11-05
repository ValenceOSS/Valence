import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeasonSourceDialog } from './SeasonSourceDialog';
import type { SeasonSource } from '@ValenceContracts/schemas/SeasonSource';

const { search, seasonsOf, choose } = vi.hoisted(() => ({
  search: vi.fn(),
  seasonsOf: vi.fn(),
  choose: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchTitleCandidates', () => ({ fetchTitleCandidates: search }));
vi.mock('@ValenceClient/admin/fetchCatalogueSeasons', () => ({ fetchCatalogueSeasons: seasonsOf }));
vi.mock('@ValenceClient/admin/chooseSeasonSource', () => ({ chooseSeasonSource: choose }));
vi.mock('@ValenceUI/notify', () => ({ notify: { worked: vi.fn(), failed: vi.fn() } }));

/**
 * Opens the dialog on a season of a show called Old Show.
 *
 * @param current - Where the season is read from now.
 * @returns What it was told.
 */
const opened = (current: SeasonSource | null = null) => {
  const told = { onClose: vi.fn(), onChanged: vi.fn() };

  render(
    <QueryClientProvider client={new QueryClient()}>
      <SeasonSourceDialog
        mediaId="episode"
        showName="Old Show"
        ownExternalId="100"
        current={current}
        isOpen
        {...told}
      />
    </QueryClientProvider>,
  );

  return told;
};

beforeEach(() => {
  vi.clearAllMocks();
  search.mockResolvedValue({
    matches: [
      {
        externalId: '100',
        kind: 'tv',
        title: 'Old Show',
        year: 2016,
        overview: null,
        posterUrl: null,
      },
      {
        externalId: '900',
        kind: 'tv',
        title: 'Old Show',
        year: 2026,
        overview: null,
        posterUrl: null,
      },
    ],
    hasMore: false,
    total: 2,
  });
  seasonsOf.mockResolvedValue({
    seasons: [
      { seasonNumber: 1, name: null, episodeCount: 6, airDate: '2026-09-04' },
      { seasonNumber: 2, name: 'The Second Run', episodeCount: 1, airDate: null },
    ],
  });
  choose.mockResolvedValue({ kind: 'reached', count: 6, jobId: 'job' });
});

describe('SeasonSourceDialog', () => {
  it('finds the other show, chooses its season, and follows the job reading the season again', async () => {
    const user = userEvent.setup();
    const told = opened();

    await user.click(await screen.findByRole('button', { name: /Old Show/u }));

    expect(seasonsOf).toHaveBeenCalledWith('episode', '900');
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();

    await user.click(await screen.findByRole('radio', { name: /Season 1/u }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(choose).toHaveBeenCalledWith('episode', { externalId: '900', externalSeason: 1 });
    });
    expect(told.onChanged).toHaveBeenCalledWith('job');
    expect(told.onClose).toHaveBeenCalled();
    expect(search).toHaveBeenCalledWith('Old Show', 'tv');
  });

  it('names a season the catalogue names, and goes back to the search', async () => {
    const user = userEvent.setup();

    opened();

    await user.click(await screen.findByRole('button', { name: /Old Show/u }));

    expect(await screen.findByRole('radio', { name: /The Second Run/u })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(await screen.findByRole('button', { name: /Old Show/u })).toBeInTheDocument();
  });

  it('says where the season is read from now, and goes back to the show’s own', async () => {
    const user = userEvent.setup();
    const told = opened({ externalId: '900', externalSeason: 1, title: 'Old Show', year: 2026 });

    expect(
      screen.getByText(/This season’s episodes come from Old Show \(2026\), season 1/u),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Use the show’s own season' }));

    await waitFor(() => {
      expect(choose).toHaveBeenCalledWith('episode', null);
    });
    expect(told.onChanged).toHaveBeenCalledWith('job');
  });

  it('offers no way back where the season is the show’s own already', async () => {
    opened();

    await screen.findByRole('button', { name: /Old Show/u });

    expect(
      screen.queryByRole('button', { name: 'Use the show’s own season' }),
    ).not.toBeInTheDocument();
  });

  it('leaves out the show the season already belongs to', async () => {
    opened();

    expect(await screen.findByRole('button', { name: /Old Show.*2026/u })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Old Show.*2016/u })).not.toBeInTheDocument();
  });

  it('chooses a show’s only season already, and the one the season is read from on reopening', async () => {
    const user = userEvent.setup();

    seasonsOf.mockResolvedValueOnce({
      seasons: [{ seasonNumber: 1, name: null, episodeCount: 6, airDate: null }],
    });
    opened();

    await user.click(await screen.findByRole('button', { name: /Old Show/u }));

    expect(await screen.findByRole('radio', { name: /Season 1/u })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
  });

  it('marks the season it is read from now as chosen', async () => {
    const user = userEvent.setup();

    opened({ externalId: '900', externalSeason: 2, title: 'Old Show', year: 2026 });

    await user.click(await screen.findByRole('button', { name: /Old Show/u }));

    expect(await screen.findByRole('radio', { name: /The Second Run/u })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });

  it('says so where the chosen show has no seasons', async () => {
    const user = userEvent.setup();

    seasonsOf.mockResolvedValueOnce({ seasons: [] });
    opened();

    await user.click(await screen.findByRole('button', { name: /Old Show/u }));

    expect(
      await screen.findByText('The catalogue lists no seasons for Old Show (2026).'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });
});
