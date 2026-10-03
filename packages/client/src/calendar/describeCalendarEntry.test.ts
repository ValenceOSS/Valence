import { describe, expect, it } from 'vitest';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { describeCalendarEntry } from './describeCalendarEntry';

describe('describeCalendarEntry', () => {
  it('names an episode by its season, number and title', () => {
    expect(describeCalendarEntry(aCalendarEntry({}))).toBe('S2 E5 · Fifth');
  });

  it('says which of a film’s releases a day is', () => {
    const film = (release: 'cinema' | 'digital' | 'physical') =>
      describeCalendarEntry(aCalendarEntry({ episode: null, release }));

    expect(film('cinema')).toBe('In cinemas');
    expect(film('digital')).toBe('To buy or rent');
    expect(film('physical')).toBe('On disc');
  });
});
