import { describe, expect, it } from 'vitest';
import { baseOfSubject } from './baseOfSubject';

describe('baseOfSubject', () => {
  it('takes a season’s or an episode’s own part off its key', () => {
    expect(baseOfSubject('tv:1399:s2', 'season')).toBe('tv:1399');
    expect(baseOfSubject('tv:1399:s2e4', 'episode')).toBe('tv:1399');
    expect(baseOfSubject('tv:1399:e63056', 'episode')).toBe('tv:1399');
    expect(baseOfSubject('series:folder:Show:s1', 'season')).toBe('series:folder:Show');
  });

  it('leaves a film’s or programme’s key as it stands', () => {
    expect(baseOfSubject('movie:603', 'film')).toBe('movie:603');
    expect(baseOfSubject('file:/films/A:s1.mkv', 'film')).toBe('file:/films/A:s1.mkv');
  });
});
