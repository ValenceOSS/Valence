import { describe, expect, it } from 'vitest';
import { isIgnoredPath } from './isIgnoredPath';

const CASES: [string, boolean][] = [
  ['/media/movie.sample.mp4', true],
  ['/media/movie/sample.mp4', true],
  ['/media/movie/sample/movie.mp4', true],
  ['/foo/sample/bar/baz.mkv', true],
  ['/media/movies/the sample/the sample.mkv', false],
  ['/media/movies/sampler.mkv', false],
  ['/media/movies/#Recycle/test.mkv', true],
  ['/media/thumbs.db', true],
  ['/media/movies/movie.avi', false],
  ['/media/.hiddendir/file.mp4', true],
  ['/media/dir/.hiddenfile.mp4', true],
  ['/media/dir/._macjunk.mp4', true],
  ['/volume1/video/Series/@eaDir/file.mkv', true],
  ['/directory/@Recycle/file.mkv', true],
  ['/media/movies/.@__thumb/foo.mkv', true],
  ['/media/music/Foo B.A.R./epic.mkv', false],
  ['/movies/.zfs/snapshot/AutoM-2023-09/film.mkv', true],
  ['/movies/.snapshot/hourly/film.mkv', true],
  ['/movies/lost+found/film.mkv', true],
  ['/movies/Film (2001)/extrafanart/clip.mkv', true],
];

describe('isIgnoredPath', () => {
  it.each(CASES)('ignores %j: %j', (path, ignored) => {
    expect(isIgnoredPath(path)).toBe(ignored);
  });
});
