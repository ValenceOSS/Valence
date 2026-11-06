import { describe, expect, it } from 'vitest';
import { readEpisodeTitle } from './readEpisodeTitle';

describe('readEpisodeTitle', () => {
  it('reads the title after the episode number, without the release noise', () => {
    expect(readEpisodeTitle('Show.S01E02.The.Second.One.1080p.WEB-DL')).toBe('The Second One');
    expect(readEpisodeTitle('Show 1x03 - A Title')).toBe('A Title');
  });

  it('reads the title without the quality Sonarr and Radarr name a file with', () => {
    expect(readEpisodeTitle('Show (2016) - S07E01 - The Next Generation WEBDL-1080p')).toBe(
      'The Next Generation',
    );
    expect(readEpisodeTitle('Show (2016) - S01E02 - Second WEBRip-720p Proper')).toBe('Second');
    expect(readEpisodeTitle('Show (2016) - S01E03 - Third SDTV')).toBe('Third');
  });

  it('reads the title without the quality Valence Requests names a file with', () => {
    expect(readEpisodeTitle('Show (2016) - S01E04 - Fourth [1080p][WEBDL][x264][EAC3 5.1]')).toBe(
      'Fourth',
    );
  });

  it('reads nothing where the name says only the number, or has none', () => {
    expect(readEpisodeTitle('Show.S01E02.1080p')).toBeNull();
    expect(readEpisodeTitle('Show - Pilot')).toBeNull();
  });
});
