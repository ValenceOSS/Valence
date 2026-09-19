import { screen } from '@testing-library/react';
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
    { season: 0, episodeCount: 2, firstAired: null },
    { season: 1, episodeCount: 9, firstAired: '2022-02-18' },
    { season: 2, episodeCount: 10, firstAired: '2025-01-17' },
  ]);
});

describe('SeasonChooser', () => {
  it('asks for every season until only some are wanted', async () => {
    const onChange = vi.fn();

    renderInAnAddress(<SeasonChooser tmdbId={95396} seasons={null} onChange={onChange} />);

    expect(screen.queryByRole('list', { name: 'Which seasons' })).not.toBeInTheDocument();
    expect(fetchSeriesSeasons).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Only some seasons' }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('ticks seasons as the catalogue lists them, specials among them', async () => {
    const onChange = vi.fn();

    renderInAnAddress(<SeasonChooser tmdbId={95396} seasons={[2]} onChange={onChange} />);

    await userEvent.click(await screen.findByRole('checkbox', { name: /Specials/ }));

    expect(onChange).toHaveBeenLastCalledWith([0, 2]);
    expect(screen.getByRole('checkbox', { name: /Season 1/ })).toHaveAccessibleDescription(
      '9 episodes · 2022',
    );
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SeasonChooser.displayName).toBe('SeasonChooser');
  });
});
