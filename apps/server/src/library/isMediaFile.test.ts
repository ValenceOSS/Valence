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
  });
});
