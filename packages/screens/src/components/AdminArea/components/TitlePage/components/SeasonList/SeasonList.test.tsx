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
    render(<SeasonList seasons={SEASONS} isFollowing={false} onFollow={vi.fn()} />);

    expect(screen.getByText('Season 1')).toBeInTheDocument();
    expect(screen.getByText('2 / 2')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it("lists an anime's cours by name, with where each falls", async () => {
    const user = userEvent.setup();

    render(
      <SeasonList
        seasons={[
          {
            season: 2,
            name: 'Show Second Arc',
            span: {
              seasons: [1],
              first: { season: 1, episode: 13 },
              last: { season: 1, episode: 14 },
              firstAbsolute: 13,
              lastAbsolute: 14,
            },
            episodes: [
              { ...anEpisode(13, 'library'), aired: { season: 1, episode: 13 } },
              { ...anEpisode(14, 'missing'), aired: { season: 1, episode: 14 } },
            ],
            isAsked: true,
            isFollowed: true,
          },
        ]}
        isFollowing={false}
        onFollow={vi.fn()}
      />,
    );

    expect(screen.getByText('Cours')).toBeInTheDocument();
    expect(screen.getByText('Show Second Arc')).toBeInTheDocument();
    expect(screen.getByText('S1 · E13–E14 · #13–14')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Show the episodes in Show Second Arc/ }));

    expect(screen.getByText('S01E14')).toBeInTheDocument();
  });

  it('opens a season onto its episodes', async () => {
    render(<SeasonList seasons={SEASONS} isFollowing={false} onFollow={vi.fn()} />);

    await userEvent.setup().click(screen.getByRole('button', { name: /Season 2/ }));

    expect(screen.getByRole('table', { name: 'Season 2' })).toBeInTheDocument();
  });

  it('follows a season, or stops', async () => {
    const onFollow = vi.fn();

    render(<SeasonList seasons={SEASONS} isFollowing={false} onFollow={onFollow} />);

    await userEvent.setup().click(screen.getByRole('switch', { name: 'Follow Season 1' }));
    await userEvent.setup().click(screen.getByRole('switch', { name: 'Follow Season 2' }));

    expect(onFollow).toHaveBeenNthCalledWith(1, SEASONS[0], true);
    expect(onFollow).toHaveBeenNthCalledWith(2, SEASONS[1], false);
  });

  it('gets new seasons as they come where it was asked for, and only then', async () => {
    const onFollowsNew = vi.fn();
    const { rerender } = render(
      <SeasonList
        seasons={SEASONS}
        isFollowing={false}
        onFollow={vi.fn()}
        followsNew
        onFollowsNew={onFollowsNew}
      />,
    );

    await userEvent.click(screen.getByRole('switch', { name: 'Get new seasons as they come' }));

    expect(onFollowsNew).toHaveBeenCalledWith(false);

    rerender(<SeasonList seasons={SEASONS} isFollowing={false} onFollow={vi.fn()} />);

    expect(
      screen.queryByRole('switch', { name: 'Get new seasons as they come' }),
    ).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SeasonList.displayName).toBe('SeasonList');
  });
});
