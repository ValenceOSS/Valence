import { describe, expect, it } from 'vitest';
import { resolveSeriesFolders } from './resolveSeriesFolders';

const root = '/media/shows';

describe('resolveSeriesFolders', () => {
  it('reads a programme filed under season folders', () => {
    const paths = [
      '/media/shows/Curb Your Enthusiasm/Season 1/Curb.S01E01.mkv',
      '/media/shows/Curb Your Enthusiasm/Season 11/Curb.S11E01.mkv',
    ];

    const folders = resolveSeriesFolders({ paths, root });

    expect(folders.get(paths[0] ?? '')).toBe('/media/shows/Curb Your Enthusiasm');
    expect(folders.get(paths[1] ?? '')).toBe('/media/shows/Curb Your Enthusiasm');
  });

  it('reads a programme whose episodes lie loose in its own folder', () => {
    const paths = ['/media/shows/Unsolved (2018)/Unsolved.S01E01.mkv'];

    expect(resolveSeriesFolders({ paths, root }).get(paths[0] ?? '')).toBe(
      '/media/shows/Unsolved (2018)',
    );
  });

  it('keeps a Specials folder inside the programme it belongs to', () => {
    const paths = [
      '/media/shows/The Fall/The Fall - S01E01 - Dark Descent.mkv',
      '/media/shows/The Fall/Specials/Deleted Scenes 1.mkv',
    ];

    expect(resolveSeriesFolders({ paths, root }).get(paths[1] ?? '')).toBe('/media/shows/The Fall');
  });

  it('keeps an extras folder under a season inside the programme', () => {
    const paths = [
      '/media/shows/School of Comedy/Season 1/School.of.Comedy.S01E01.mkv',
      '/media/shows/School of Comedy/Season 1/Season 1 extras/Out takes 1.mkv',
    ];

    expect(resolveSeriesFolders({ paths, root }).get(paths[1] ?? '')).toBe(
      '/media/shows/School of Comedy',
    );
  });

  it('walks past a drawer holding several programmes rather than merging them', () => {
    const paths = [
      '/media/shows/Marvel/Daredevil/Season 1/Daredevil.S01E01.mkv',
      '/media/shows/Marvel/Jessica Jones/Season 1/Jessica.Jones.S01E01.mkv',
    ];

    const folders = resolveSeriesFolders({ paths, root });

    expect(folders.get(paths[0] ?? '')).toBe('/media/shows/Marvel/Daredevil');
    expect(folders.get(paths[1] ?? '')).toBe('/media/shows/Marvel/Jessica Jones');
  });

  it('gives a loose episode in the library root no folder, since nothing files it', () => {
    const paths = ['/media/shows/Some.Show.S01E01.mkv'];

    expect(resolveSeriesFolders({ paths, root }).has(paths[0] ?? '')).toBe(false);
  });

  it('reads a season folder written as a release name', () => {
    const paths = ['/media/shows/Family Guy/Family.Guy.S01.1080p.WEB-DL/Family.Guy.S01E01.mkv'];

    expect(resolveSeriesFolders({ paths, root }).get(paths[0] ?? '')).toBe(
      '/media/shows/Family Guy',
    );
  });

  it('reads a season folder written the British way', () => {
    const paths = [
      "/media/shows/Harry Hill's TV Burp/Harry Hill's TV Burp - Series 01/episode.mkv",
    ];

    expect(resolveSeriesFolders({ paths, root }).get(paths[0] ?? '')).toBe(
      "/media/shows/Harry Hill's TV Burp",
    );
  });

  it('holds two same-named programmes apart by the folders above them', () => {
    const paths = [
      '/media/shows/UK/The Office/The.Office.S01E01.mkv',
      '/media/shows/US/The Office/The.Office.S01E01.mkv',
    ];

    const folders = resolveSeriesFolders({ paths, root });

    expect(folders.get(paths[0] ?? '')).not.toBe(folders.get(paths[1] ?? ''));
  });

  it('takes a root given with a trailing slash to mean the same directory', () => {
    const paths = ['/media/shows/Some Show/Season 1/Some.Show.S01E01.mkv'];

    expect(resolveSeriesFolders({ paths, root: '/media/shows/' }).get(paths[0] ?? '')).toBe(
      '/media/shows/Some Show',
    );
  });

  it('gives a film its own folder, which names no programme once nothing calls it one', () => {
    const paths = ['/media/films/Arrival (2016)/Arrival (2016).mkv'];

    expect(resolveSeriesFolders({ paths, root: '/media/films' }).get(paths[0] ?? '')).toBe(
      '/media/films/Arrival (2016)',
    );
  });

  it('ignores a file outside the root rather than guessing at it', () => {
    const paths = ['/elsewhere/Some Show/Season 1/Some.Show.S01E01.mkv'];

    expect(resolveSeriesFolders({ paths, root }).has(paths[0] ?? '')).toBe(false);
  });
});

describe('a folder named nothing but a number', () => {
  it('is a season when it sits inside a programme', () => {
    const paths = ['/media/shows/Some Show/01/episode 1.mkv'];

    expect(resolveSeriesFolders({ paths, root }).get(paths[0] ?? '')).toBe(
      '/media/shows/Some Show',
    );
  });

  it('is a programme when it sits in the library root', () => {
    const paths = ['/media/shows/24/24 S02 web/24.S02E01.mkv'];

    expect(resolveSeriesFolders({ paths, root }).get(paths[0] ?? '')).toBe('/media/shows/24');
  });

  it('is still a programme when its episodes lie loose inside it', () => {
    const paths = ['/media/shows/1923/1923.S01E01.mkv'];

    expect(resolveSeriesFolders({ paths, root }).get(paths[0] ?? '')).toBe('/media/shows/1923');
  });
});
