import { describe, expect, it } from 'vitest';
import { episodeEntryId } from './episodeEntryId';

describe('episodeEntryId', () => {
  it('names an episode by its series in the catalogue, its season and its number', () => {
    expect(episodeEntryId('300', 2, 5)).toBe('tv:300:s2e5');
  });
});
