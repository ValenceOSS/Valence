import { describe, expect, it } from 'vitest';
import { aViewing } from '@ValenceClient/testing/aViewing';
import { groupHistory } from './groupHistory';

const episode = (id: string, at: string, seriesId: string | null = 'series-1') =>
  aViewing({
    id,
    mediaItemId: `media-${id}`,
    title: id,
    seriesTitle: 'Severance',
    seriesId,
    lastWatchedAt: at,
  });

describe('groupHistory', () => {
  it('stands a programme once, at the episode watched last', () => {
    const titles = groupHistory([
      episode('one', '2026-09-01T20:00:00.000Z'),
      episode('two', '2026-09-02T20:00:00.000Z'),
      episode('three', '2026-09-03T20:00:00.000Z'),
    ]);

    expect(titles).toHaveLength(1);
    expect(titles[0]?.latest.id).toBe('three');
    expect(titles[0]?.viewingIds).toEqual(['three', 'two', 'one']);
  });

  it('puts what was watched most recently first, films and programmes alike', () => {
    const titles = groupHistory([
      episode('one', '2026-09-01T20:00:00.000Z'),
      aViewing({ id: 'film', lastWatchedAt: '2026-09-02T20:00:00.000Z' }),
      episode('two', '2026-09-03T20:00:00.000Z'),
    ]);

    expect(titles.map((title) => title.latest.id)).toEqual(['two', 'film']);
  });

  it('stands a film watched twice once', () => {
    const titles = groupHistory([
      aViewing({ id: 'again', lastWatchedAt: '2026-09-05T20:00:00.000Z' }),
      aViewing({ id: 'first', lastWatchedAt: '2026-09-01T20:00:00.000Z' }),
    ]);

    expect(titles.map((title) => title.viewingIds)).toEqual([['again', 'first']]);
  });

  it('knows a programme by its name where the server does not say which series it is', () => {
    const titles = groupHistory([
      episode('one', '2026-09-01T20:00:00.000Z', null),
      episode('two', '2026-09-02T20:00:00.000Z', null),
    ]);

    expect(titles).toHaveLength(1);
  });

  it('keeps two films apart', () => {
    expect(
      groupHistory([
        aViewing({ id: 'a', mediaItemId: 'film-a' }),
        aViewing({ id: 'b', mediaItemId: 'film-b' }),
      ]),
    ).toHaveLength(2);
  });
});
