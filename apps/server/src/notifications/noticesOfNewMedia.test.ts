import { describe, expect, it } from 'vitest';
import { noticesOfNewMedia } from './noticesOfNewMedia';
import type { AddedItem } from './summariseNewMedia';

const NOW = new Date('2026-10-15T12:00:00Z');

const episode = (
  id: string,
  seriesId: string,
  seriesTitle: string,
  releaseDate: string | null,
  seasonNumber: number | null = 1,
  episodeNumber: number | null = 1,
): AddedItem => ({
  id,
  title: `Episode ${id}`,
  seriesId,
  seriesTitle,
  albumId: null,
  albumTitle: null,
  seasonNumber,
  episodeNumber,
  releaseDate,
});

const film = (id: string, title: string): AddedItem => ({
  id,
  title,
  seriesId: null,
  seriesTitle: null,
  albumId: null,
  albumTitle: null,
});

const told = (items: AddedItem[]) =>
  noticesOfNewMedia(items, NOW).map((notice) => ({
    title: notice.title.message,
    body: notice.body.message,
    link: notice.link,
  }));

describe('noticesOfNewMedia', () => {
  it('tells of each episode that came out this week on its own', () => {
    expect(
      told([
        episode('a', 'show', 'A Show', '2026-10-14', 2, 5),
        episode('b', 'other', 'Another Show', '2026-10-10', 1, 3),
      ]),
    ).toEqual([
      { title: 'New episode of A Show', body: 'Season 2, episode 5: Episode a', link: '/?item=a' },
      {
        title: 'New episode of Another Show',
        body: 'Season 1, episode 3: Episode b',
        link: '/?item=b',
      },
    ]);
  });

  it('tells of older episodes once for each programme, saying how many', () => {
    expect(
      told([
        episode('a', 'show', 'A Show', '2021-03-01', 1, 1),
        episode('b', 'show', 'A Show', '2021-03-08', 1, 2),
        episode('c', 'show', 'A Show', '2021-03-15', 1, 3),
      ]),
    ).toEqual([
      {
        title: '3 episodes of A Show were added',
        body: 'From season 1',
        link: '/?show=show',
      },
    ]);
  });

  it('takes an episode that does not say when it aired as an older one', () => {
    expect(told([episode('a', 'show', 'A Show', null)])).toEqual([
      {
        title: 'An episode of A Show was added',
        body: 'From season 1',
        link: '/?show=show',
      },
    ]);
  });

  it('says which seasons older episodes are from', () => {
    expect(
      told([
        episode('a', 'show', 'A Show', '2019-01-01', 2),
        episode('b', 'show', 'A Show', '2018-01-01', 1),
        episode('c', 'show', 'A Show', '2020-01-01', 3),
      ])[0]?.body,
    ).toBe('From seasons 1, 2 and 3');
  });

  it('counts older episodes in with everything else where many programmes came at once', () => {
    const notices = told([
      episode('a', 'one', 'One', '2020-01-01'),
      episode('b', 'two', 'Two', '2020-01-01'),
      episode('c', 'three', 'Three', '2020-01-01'),
      episode('d', 'four', 'Four', '2020-01-01'),
      film('e', 'A Film'),
    ]);

    expect(notices).toHaveLength(1);
    expect(notices[0]?.body).toContain('4 episodes');
  });

  it('says films and music as one notice beside the episodes', () => {
    expect(
      told([episode('a', 'show', 'A Show', '2026-10-14', 2, 5), film('e', 'A Film')]).map(
        (notice) => notice.title,
      ),
    ).toEqual(['New episode of A Show', 'Something new to watch']);
  });

  it('says nothing of a window in which nothing arrived', () => {
    expect(told([])).toEqual([]);
  });
});
