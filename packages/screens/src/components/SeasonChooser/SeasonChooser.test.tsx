import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { SeasonChooser } from './SeasonChooser';
import type * as Requests from '@ValenceClient/requests/fetchMediaRequests';

const fetchSeriesSeasons = vi.fn<typeof Requests.fetchSeriesSeasons>();

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  fetchSeriesSeasons: (tmdbId: number) => fetchSeriesSeasons(tmdbId),
}));

beforeEach(() => {
  fetchSeriesSeasons.mockReset().mockResolvedValue([
    { season: 0, episodeCount: 2, firstAired: null, standing: 'askable' },
    { season: 1, episodeCount: 9, firstAired: '2022-02-18', standing: 'askable' },
    { season: 2, episodeCount: 10, firstAired: '2025-01-17', standing: 'askable' },
  ]);
});

/**
 * The row naming a season.
 */
const rowOf = (name: string) =>
  screen.getAllByRole('row').find((row) => row.textContent.includes(name)) ?? document.body;

describe('SeasonChooser', () => {
  it('lists a season a row, with its episodes and the year it began', async () => {
    renderInAnAddress(<SeasonChooser tmdbId={95396} seasons={null} onChange={vi.fn()} />);

    expect(await screen.findByText('Season 1')).toBeInTheDocument();
    expect(within(rowOf('Season 1')).getByText('9')).toBeInTheDocument();
    expect(within(rowOf('Season 1')).getByText('2022')).toBeInTheDocument();
    expect(within(rowOf('Specials')).getByText('—')).toBeInTheDocument();
  });

  it('says where each season stands, so nobody asks twice for what is here', async () => {
    fetchSeriesSeasons.mockResolvedValue([
      { season: 1, episodeCount: 9, firstAired: '2022-02-18', standing: 'library' },
      { season: 2, episodeCount: 10, firstAired: '2025-01-17', standing: 'partly' },
      { season: 3, episodeCount: 8, firstAired: '2026-01-01', standing: 'requested' },
      { season: 4, episodeCount: 8, firstAired: null, standing: 'askable' },
    ]);

    renderInAnAddress(<SeasonChooser tmdbId={95396} seasons={null} onChange={vi.fn()} />);

    expect(await screen.findByText('Season 1')).toBeInTheDocument();
    expect(within(rowOf('Season 1')).getByText('In the library')).toBeInTheDocument();
    expect(within(rowOf('Season 2')).getByText('Partly here')).toBeInTheDocument();
    expect(within(rowOf('Season 3')).getByText('Requested')).toBeInTheDocument();
    expect(within(rowOf('Season 4')).getByText('Not requested')).toBeInTheDocument();
  });

  it('takes every season until one is dropped', async () => {
    const onChange = vi.fn();

    renderInAnAddress(<SeasonChooser tmdbId={95396} seasons={null} onChange={onChange} />);

    expect(await screen.findByText('Every season, and any that come later.')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Season 1' })).toBeChecked();

    await userEvent.click(screen.getByRole('switch', { name: 'Specials' }));

    expect(onChange).toHaveBeenLastCalledWith([1, 2]);
  });

  it('comes back to every season once the last one is taken', async () => {
    const onChange = vi.fn();

    renderInAnAddress(<SeasonChooser tmdbId={95396} seasons={[0, 2]} onChange={onChange} />);

    expect(await screen.findByText('2 of 3 seasons.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('switch', { name: 'Season 1' }));

    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('takes the lot, and drops the lot, from the header', async () => {
    const onChange = vi.fn();
    const { rerender } = renderInAnAddress(
      <SeasonChooser tmdbId={95396} seasons={[2]} onChange={onChange} />,
    );

    await userEvent.click(await screen.findByRole('switch', { name: 'Every season' }));

    expect(onChange).toHaveBeenLastCalledWith(null);

    rerender(<SeasonChooser tmdbId={95396} seasons={null} onChange={onChange} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Every season' }));

    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('says when nothing is taken yet', async () => {
    renderInAnAddress(<SeasonChooser tmdbId={95396} seasons={[]} onChange={vi.fn()} />);

    expect(await screen.findByText('No season is taken yet.')).toBeInTheDocument();
  });

  it('keeps a switch the same element as what is taken changes, so its animation runs', async () => {
    const onChange = vi.fn();
    const { rerender } = renderInAnAddress(
      <SeasonChooser tmdbId={95396} seasons={[1]} onChange={onChange} />,
    );

    const before = await screen.findByRole('switch', { name: 'Season 2' });

    rerender(<SeasonChooser tmdbId={95396} seasons={[1, 2]} onChange={onChange} />);

    expect(screen.getByRole('switch', { name: 'Season 2' })).toBe(before);
    expect(before).toBeChecked();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SeasonChooser.displayName).toBe('SeasonChooser');
  });
});
