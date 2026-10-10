import { useState } from 'react';
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

const SERIES = { tmdbId: 95396, followsNew: true, onFollowsNew: vi.fn() };

/**
 * The row naming a season.
 */
const rowOf = (name: string) =>
  screen.getAllByRole('row').find((row) => row.textContent.includes(name)) ?? document.body;

/**
 * A chooser that keeps what it is told, as the dialogs that draw it do.
 */
const Kept = ({ from, following = true }: { from: number[] | null; following?: boolean }) => {
  const [seasons, setSeasons] = useState(from);
  const [followsNew, setFollowsNew] = useState(following);

  return (
    <SeasonChooser
      tmdbId={95396}
      seasons={seasons}
      onChange={setSeasons}
      followsNew={followsNew}
      onFollowsNew={setFollowsNew}
    />
  );
};

describe('SeasonChooser', () => {
  it('lists a season a row, with its episodes and the year it began', async () => {
    renderInAnAddress(<SeasonChooser {...SERIES} seasons={null} onChange={vi.fn()} />);

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

    renderInAnAddress(<SeasonChooser {...SERIES} seasons={null} onChange={vi.fn()} />);

    expect(await screen.findByText('Season 1')).toBeInTheDocument();
    expect(within(rowOf('Season 1')).getByText('In the library')).toBeInTheDocument();
    expect(within(rowOf('Season 2')).getByText('Partially available')).toBeInTheDocument();
    expect(within(rowOf('Season 3')).getByText('Requested')).toBeInTheDocument();
    expect(within(rowOf('Season 4')).getByText('Not requested')).toBeInTheDocument();
  });

  it('locks a season the library holds whole, and leaves one it holds part of open', async () => {
    const onChange = vi.fn();

    fetchSeriesSeasons.mockResolvedValue([
      { season: 1, episodeCount: 9, firstAired: '2022-02-18', standing: 'library' },
      { season: 2, episodeCount: 10, firstAired: '2025-01-17', standing: 'partly' },
      { season: 3, episodeCount: 8, firstAired: null, standing: 'askable' },
    ]);

    renderInAnAddress(<SeasonChooser {...SERIES} seasons={[2]} onChange={onChange} />);

    expect(await screen.findByRole('switch', { name: 'Season 1' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Season 1' })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'Season 2' })).toBeEnabled();
    expect(screen.getByText('1 of 2 seasons.')).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('switch', { name: 'Season 3' }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('takes every regular season until one is dropped, leaving Specials out', async () => {
    const onChange = vi.fn();

    renderInAnAddress(<SeasonChooser {...SERIES} seasons={null} onChange={onChange} />);

    expect(await screen.findByRole('switch', { name: 'Season 1' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Specials' })).not.toBeChecked();

    await userEvent.click(screen.getByRole('switch', { name: 'Season 2' }));

    expect(onChange).toHaveBeenLastCalledWith([1]);
  });

  it('takes Specials on their own, never as part of every season', async () => {
    const onChange = vi.fn();

    renderInAnAddress(<SeasonChooser {...SERIES} seasons={null} onChange={onChange} />);

    await userEvent.click(await screen.findByRole('switch', { name: 'Specials' }));

    expect(onChange).toHaveBeenLastCalledWith([0, 1, 2]);
  });

  it('comes back to every season once the last regular one is taken', async () => {
    const onChange = vi.fn();

    renderInAnAddress(<SeasonChooser {...SERIES} seasons={[2]} onChange={onChange} />);

    expect(await screen.findByText('1 of 2 seasons.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('switch', { name: 'Season 1' }));

    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('gets new seasons as they come as a choice of its own', async () => {
    const onFollowsNew = vi.fn();

    renderInAnAddress(
      <SeasonChooser
        {...SERIES}
        seasons={[1]}
        onChange={vi.fn()}
        followsNew
        onFollowsNew={onFollowsNew}
      />,
    );

    const following = await screen.findByRole('switch', { name: 'Get new seasons as they come' });

    expect(following).toBeChecked();

    await userEvent.click(following);

    expect(onFollowsNew).toHaveBeenCalledWith(false);
  });

  it('shows the seasons a request already asks for as taken, adding to it', async () => {
    renderInAnAddress(
      <SeasonChooser
        {...SERIES}
        seasons={[]}
        onChange={vi.fn()}
        followsNew={false}
        alreadyAsked={[1]}
        isFollowedAlready
      />,
    );

    expect(await screen.findByRole('switch', { name: 'Season 1' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Season 1' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Season 2' })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'Get new seasons as they come' })).toBeChecked();
    expect(screen.getByRole('switch', { name: 'Get new seasons as they come' })).toBeDisabled();
  });

  it('takes the lot, and drops the lot, from the header', async () => {
    const onChange = vi.fn();
    const { rerender } = renderInAnAddress(
      <SeasonChooser {...SERIES} seasons={[2]} onChange={onChange} />,
    );

    await userEvent.click(await screen.findByRole('switch', { name: 'Every season' }));

    expect(onChange).toHaveBeenLastCalledWith(null);

    rerender(<SeasonChooser {...SERIES} seasons={null} onChange={onChange} />);

    await userEvent.click(screen.getByRole('switch', { name: 'Every season' }));

    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('says when nothing is taken yet', async () => {
    renderInAnAddress(<SeasonChooser {...SERIES} seasons={[]} onChange={vi.fn()} />);

    expect(await screen.findByText('No seasons selected yet.')).toBeInTheDocument();
  });

  it('keeps a switch the same element as what is taken changes, so its animation runs', async () => {
    const onChange = vi.fn();
    const { rerender } = renderInAnAddress(
      <SeasonChooser {...SERIES} seasons={[1]} onChange={onChange} />,
    );

    const before = await screen.findByRole('switch', { name: 'Season 2' });

    rerender(<SeasonChooser {...SERIES} seasons={[1, 2]} onChange={onChange} />);

    expect(screen.getByRole('switch', { name: 'Season 2' })).toBe(before);
    expect(before).toBeChecked();
  });

  it('stops getting new seasons once no regular season is taken, and gets them again once one is', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<Kept from={null} />);

    const following = await screen.findByRole('switch', { name: 'Get new seasons as they come' });

    await user.click(screen.getByRole('switch', { name: 'Every season' }));

    expect(following).not.toBeChecked();

    await user.click(screen.getByRole('switch', { name: 'Season 1' }));

    expect(following).toBeChecked();
  });

  it('keeps new seasons as somebody set them by hand, whatever is taken after', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<Kept from={[1]} following={false} />);

    const following = await screen.findByRole('switch', { name: 'Get new seasons as they come' });

    await user.click(screen.getByRole('switch', { name: 'Season 1' }));
    await user.click(screen.getByRole('switch', { name: 'Season 2' }));

    expect(following).not.toBeChecked();
  });

  it('keeps getting new seasons while a regular season is still taken', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<Kept from={[1, 2]} />);

    const following = await screen.findByRole('switch', { name: 'Get new seasons as they come' });

    await user.click(screen.getByRole('switch', { name: 'Season 2' }));

    expect(following).toBeChecked();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SeasonChooser.displayName).toBe('SeasonChooser');
  });
});
