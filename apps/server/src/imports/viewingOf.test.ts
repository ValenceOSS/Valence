import { describe, expect, it } from 'vitest';
import { aSourceItem } from './aSourceToImport';
import type { ItemMatch } from './matchSourceItem';
import { viewingOf } from './viewingOf';
import type { SourceUserState } from './SourceReader';

const NOW = new Date('2026-10-02T12:00:00Z');

const STATE: SourceUserState = {
  itemId: 'heat',
  isPlayed: false,
  playCount: 0,
  lastPlayedAt: null,
  positionSeconds: 0,
  isFavourite: false,
  rating: null,
};

const CATALOGUE = {
  byId: new Map([
    [
      'heat',
      aSourceItem({
        id: 'heat',
        kind: 'movie',
        title: 'Heat',
        durationSeconds: 99,
        addedAt: new Date('2026-03-01T00:00:00Z'),
      }),
    ],
    ['wire', aSourceItem({ id: 'wire', kind: 'series', title: 'The Wire' })],
  ]),
  matches: new Map<string, ItemMatch>([
    ['heat', { kind: 'item', mediaItemId: 'valence-heat', by: 'id' }],
    ['wire', { kind: 'series', seriesId: 'valence-wire', by: 'id' }],
    ['lost', { kind: 'unmatched', reason: { code: null, message: 'x', values: {} } }],
  ]),
};

/**
 * What a person's states and plays become.
 *
 * @param states - Their states.
 * @param plays - Their plays.
 * @returns What to write.
 */
const viewing = (
  states: SourceUserState[],
  plays: { key: string; itemId: string; at: Date }[] = [],
) =>
  viewingOf({
    sourceId: 'src',
    userId: 'u',
    states,
    plays,
    catalogue: CATALOGUE,
    durations: new Map([['valence-heat', 100]]),
    now: NOW,
  });

describe('viewingOf', () => {
  it('turns a play count into that many viewings, the last on its real date', () => {
    const made = viewing([
      {
        ...STATE,
        isPlayed: true,
        playCount: 3,
        lastPlayedAt: new Date('2026-03-10T00:00:00Z'),
        isFavourite: true,
        rating: 7,
      },
    ]);

    expect(made.watched).toEqual([
      { mediaItemId: 'valence-heat', durationSeconds: 100, at: new Date('2026-03-10T00:00:00Z') },
    ]);
    expect(
      made.plays.map((play) => [play.at.toISOString(), play.importKey, play.secondsWatched]),
    ).toEqual([
      ['2026-03-04T00:00:00.000Z', 'src:u:heat:0', 100],
      ['2026-03-07T00:00:00.000Z', 'src:u:heat:1', 100],
      ['2026-03-10T00:00:00.000Z', 'src:u:heat:2', 100],
    ]);
    expect(made.favourites).toEqual(['valence-heat']);
    expect(made.ratings).toEqual([{ subject: { mediaId: 'valence-heat' }, stars: 4 }]);
  });

  it('keeps real plays and dates only the rest, before the earliest of them', () => {
    const made = viewing(
      [{ ...STATE, isPlayed: true, playCount: 2, lastPlayedAt: new Date('2026-03-10T00:00:00Z') }],
      [{ key: 'h/1', itemId: 'heat', at: new Date('2026-03-10T00:00:00Z') }],
    );

    expect(made.plays.map((play) => [play.importKey, play.at.toISOString()])).toEqual([
      ['src:h/1', '2026-03-10T00:00:00.000Z'],
      ['src:u:heat:0', '2026-03-09T00:00:00.000Z'],
    ]);
  });

  it('counts something marked watched by hand as one play where it has a date', () => {
    expect(
      viewing([{ ...STATE, isPlayed: true, lastPlayedAt: new Date('2026-01-01T00:00:00Z') }]).plays,
    ).toHaveLength(1);
    expect(viewing([{ ...STATE, isPlayed: true }]).plays).toHaveLength(0);
  });

  it('dates plays with no date of their own when the item arrived', () => {
    expect(viewing([{ ...STATE, playCount: 1 }]).plays[0]?.at).toEqual(
      new Date('2026-03-01T00:00:00Z'),
    );
  });

  it('keeps where somebody stopped, dated now where the source did not say', () => {
    expect(viewing([{ ...STATE, positionSeconds: 40 }]).resumes).toEqual([
      { mediaItemId: 'valence-heat', positionSeconds: 40, durationSeconds: 100, at: NOW },
    ]);
  });

  it('rates a programme but cannot keep it as a favourite, and passes over what did not match', () => {
    const made = viewing([
      { ...STATE, itemId: 'wire', isFavourite: true, rating: 10 },
      { ...STATE, itemId: 'lost', isPlayed: true, playCount: 4 },
      { ...STATE, itemId: 'nowhere', isPlayed: true },
    ]);

    expect(made.ratings).toEqual([{ subject: { seriesId: 'valence-wire' }, stars: 5 }]);
    expect(made.unkeptFavourites).toBe(1);
    expect(made.plays).toEqual([]);
    expect(made.watched).toEqual([]);
  });

  it('passes over plays of something that did not match', () => {
    expect(viewing([], [{ key: 'k', itemId: 'lost', at: NOW }]).plays).toEqual([]);
  });
});
