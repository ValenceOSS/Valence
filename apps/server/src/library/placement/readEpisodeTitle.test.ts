import { describe, expect, it } from 'vitest';
import { readEpisodeTitle } from './readEpisodeTitle';

describe('readEpisodeTitle', () => {
  it('reads the title after the episode number, without the release noise', () => {
    expect(readEpisodeTitle('Show.S01E02.The.Second.One.1080p.WEB-DL')).toBe('The Second One');
    expect(readEpisodeTitle('Show 1x03 - A Title')).toBe('A Title');
  });

  it('reads nothing where the name says only the number, or has none', () => {
    expect(readEpisodeTitle('Show.S01E02.1080p')).toBeNull();
    expect(readEpisodeTitle('Show - Pilot')).toBeNull();
  });
});
