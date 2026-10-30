import { describe, expect, it } from 'vitest';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { describeCalendarEntry } from './describeCalendarEntry';

describe('describeCalendarEntry', () => {
  it('names an episode by its season, number and title', () => {
    expect(describeCalendarEntry(aCalendarEntry({}))).toBe('S2 E5 · Fifth');
  });

  it('names an episode only by its season and number where the catalogue has no real title', () => {
    const titled = (title: string) =>
      describeCalendarEntry(
        aCalendarEntry({
          episode: { seasonNumber: 22, episodeNumber: 110, title, stillUrl: null },
        }),
      );

    expect(titled('Episode 110')).toBe('S22 E110');
    expect(titled('episode 110')).toBe('S22 E110');
    expect(titled('Episode 0110')).toBe('S22 E110');
    expect(titled('')).toBe('S22 E110');
    expect(titled('Episode 11')).toBe('S22 E110 · Episode 11');
    expect(titled('Friday, 30th October 2026')).toBe('S22 E110 · Friday, 30th October 2026');
  });

  it('says which of a film’s releases a day is', () => {
    const film = (release: 'cinema' | 'digital' | 'physical') =>
      describeCalendarEntry(aCalendarEntry({ episode: null, release }));

    expect(film('cinema')).toBe('In cinemas');
    expect(film('digital')).toBe('To buy or rent');
    expect(film('physical')).toBe('On disc');
  });
});
