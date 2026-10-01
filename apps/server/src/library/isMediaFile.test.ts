import { describe, expect, it } from 'vitest';
import { isMediaFile } from './isMediaFile';

describe('isMediaFile', () => {
  it('takes a video by its extension, whatever its case', () => {
    expect(isMediaFile('/movies/Heat (1995)/Heat.MKV')).toBe(true);
  });

  it('leaves out subtitles, artwork and information files', () => {
    expect(
      ['a.srt', 'poster.jpg', 'movie.nfo'].map((name) => isMediaFile(`/movies/${name}`)),
    ).toEqual([false, false, false]);
  });

  it('leaves out the re-encodes Valence keeps beside a library', () => {
    expect(isMediaFile('/movies/.valence/renditions/abc.mkv')).toBe(false);
    expect(isMediaFile('C:\\movies\\.valence\\renditions\\abc.mkv')).toBe(false);
  });

  it('leaves out the copies Valence keeps beside a film', () => {
    expect(isMediaFile('/movies/Arrival (2016)/Arrival (2016) - 1080p H264.valence.mp4')).toBe(
      false,
    );
    expect(isMediaFile('/movies/Arrival (2016)/Arrival (2016).mkv')).toBe(true);
  });
});
