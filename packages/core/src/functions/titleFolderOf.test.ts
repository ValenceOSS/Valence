import { describe, expect, it } from 'vitest';
import { titleFolderOf } from './titleFolderOf';

describe('titleFolderOf', () => {
  it('finds the folder every season sits in', () => {
    expect(
      titleFolderOf([
        '/media/shows/From/Season 1/From S01E01.mkv',
        '/media/shows/From/Season 2/From S02E01.mkv',
      ]),
    ).toBe('/media/shows/From');
  });

  it('steps up out of the one season folder a series has so far', () => {
    expect(
      titleFolderOf([
        '/media/shows/From/Season 1/From S01E01.mkv',
        '/media/shows/From/Season 1/From S01E02.mkv',
      ]),
    ).toBe('/media/shows/From');
  });

  it('keeps a series whose episodes sit loose in its own folder', () => {
    expect(titleFolderOf(['/media/shows/From/From S01E01.mkv'])).toBe('/media/shows/From');
  });

  it('says nothing for a series with no files', () => {
    expect(titleFolderOf([])).toBeNull();
  });

  it('does not take a series named like a season for a season', () => {
    expect(titleFolderOf(['/media/shows/Series of Unfortunate Events/Episode 1.mkv'])).toBe(
      '/media/shows/Series of Unfortunate Events',
    );
  });

  it('steps up out of a disc folder to the album', () => {
    expect(titleFolderOf(['/media/music/Pink Floyd/The Wall/CD 1/01 In the Flesh.flac'])).toBe(
      '/media/music/Pink Floyd/The Wall',
    );
  });
});
