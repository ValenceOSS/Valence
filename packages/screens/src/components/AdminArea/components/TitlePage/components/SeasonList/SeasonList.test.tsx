import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SeasonList } from './SeasonList';
import type { TitleSeason } from '@ValenceClient/requests/seasonsOfTitle';

/**
 * An episode of a season, where it stands.
 *
 * @param episode - Its number.
 * @param part - Where it stands.
 * @returns The episode.
 */
const anEpisode = (episode: number, part: TitleSeason['episodes'][number]['part']) => ({
  episode,
  title: `Episode ${episode.toString()}`,
  airDate: null,
  part,
  problem: null,
  path: null,
  itemId: null,
});

const SEASONS: TitleSeason[] = [
  {
    season: 1,
    episodes: [anEpisode(1, 'library'), anEpisode(2, 'library')],
    isAsked: false,
    isFollowed: false,
  },
  {
    season: 2,
    episodes: [anEpisode(1, 'library'), anEpisode(2, 'failed')],
    isAsked: true,
    isFollowed: true,
  },
];

describe('SeasonList', () => {
  it('lists each season with how much is here and anything needing a look', () => {
    render(<SeasonList seasons={SEASONS} note={null} isFollowing={false} onFollow={vi.fn()} />);

    expect(screen.getByText('Season 1')).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('opens a season onto its episodes', async () => {
    render(<SeasonList seasons={SEASONS} note={null} isFollowing={false} onFollow={vi.fn()} />);

    await userEvent.setup().click(screen.getByRole('button', { name: /Season 2/ }));

    expect(screen.getByRole('table', { name: 'Season 2' })).toBeInTheDocument();
  });

  it('follows a season, or stops', async () => {
    const onFollow = vi.fn();

    render(
      <SeasonList
        seasons={SEASONS}
        note="New seasons go in Show/Season NN/"
        isFollowing={false}
        onFollow={onFollow}
      />,
    );

    await userEvent.setup().click(screen.getByRole('switch', { name: 'Follow Season 1' }));
    await userEvent.setup().click(screen.getByRole('switch', { name: 'Follow Season 2' }));

    expect(onFollow).toHaveBeenNthCalledWith(1, SEASONS[0], true);
    expect(onFollow).toHaveBeenNthCalledWith(2, SEASONS[1], false);
    expect(screen.getByText('New seasons go in Show/Season NN/')).toBeInTheDocument();
  });

  it('gets new seasons as they come where it was asked for, and only then', async () => {
    const onFollowsNew = vi.fn();
    const { rerender } = render(
      <SeasonList
        seasons={SEASONS}
        note={null}
        isFollowing={false}
        onFollow={vi.fn()}
        followsNew
        onFollowsNew={onFollowsNew}
      />,
    );

    await userEvent.click(screen.getByRole('switch', { name: 'Get new seasons as they come' }));

    expect(onFollowsNew).toHaveBeenCalledWith(false);

    rerender(<SeasonList seasons={SEASONS} note={null} isFollowing={false} onFollow={vi.fn()} />);

    expect(
      screen.queryByRole('switch', { name: 'Get new seasons as they come' }),
    ).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SeasonList.displayName).toBe('SeasonList');
  });
});
