import { describe, expect, it } from 'vitest';
import { freshFlags } from './freshFlags';

const NOW = Date.parse('2026-09-28T12:00:00.000Z');

const DAY = 24 * 60 * 60 * 1000;

const aTitle = (
  id: string,
  daysAgo: number,
  series: { seriesId?: string | null; seriesTitle?: string | null } = {},
) => ({
  id,
  addedAt: new Date(NOW - daysAgo * DAY).toISOString(),
  seriesId: series.seriesId ?? null,
  seriesTitle: series.seriesTitle ?? null,
});

describe('freshFlags', () => {
  it('says a film added this week was recently added', () => {
    const film = aTitle('film', 2);

    expect(freshFlags([film], NOW)(film)).toBe('Recently added');
  });

  it('flags nothing added more than two weeks ago', () => {
    const film = aTitle('film', 20);

    expect(freshFlags([film], NOW)(film)).toBeNull();
  });

  it('flags only the six newest titles, however many arrived at once', () => {
    const library = Array.from({ length: 10 }, (_, at) => aTitle(`film-${at.toString()}`, at));
    const flagOf = freshFlags(library, NOW);

    expect(library.filter((title) => flagOf(title) !== null).map((title) => title.id)).toEqual(
      library.slice(0, 6).map((title) => title.id),
    );
  });

  it('says a programme that was already here has a new episode', () => {
    const old = aTitle('e1', 60, { seriesId: 'show' });
    const latest = aTitle('e2', 1, { seriesId: 'show' });
    const flagOf = freshFlags([old, latest], NOW);

    expect(flagOf(latest)).toBe('New episode');
    expect(flagOf(old)).toBe('New episode');
  });

  it('says a programme that arrived whole was recently added', () => {
    const first = aTitle('e1', 3, { seriesTitle: 'Severance' });
    const second = aTitle('e2', 2, { seriesTitle: 'Severance' });

    expect(freshFlags([first, second], NOW)(second)).toBe('Recently added');
  });

  it('passes over a title whose date cannot be read', () => {
    const odd = { ...aTitle('odd', 0), addedAt: 'whenever' };

    expect(freshFlags([odd], NOW)(odd)).toBeNull();
  });
});
