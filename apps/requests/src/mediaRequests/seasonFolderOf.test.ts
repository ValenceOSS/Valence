import { describe, expect, it } from 'vitest';
import { seasonFolderOf } from './seasonFolderOf';

describe('seasonFolderOf', () => {
  it('puts a new season in a folder of its own inside the series', () => {
    expect(seasonFolderOf('/media/Series/Show', 4, [])).toBe('/media/Series/Show/Season 04');
  });

  it('puts an episode of a season already held beside the others', () => {
    expect(
      seasonFolderOf('/media/Series/Show', 2, [{ season: 2, folder: '/media/Series/Show/S2' }]),
    ).toBe('/media/Series/Show/S2');
  });

  it('puts an episode beside loose episodes of its season in the series folder', () => {
    expect(
      seasonFolderOf('/media/Series/Show', 1, [{ season: 1, folder: '/media/Series/Show' }]),
    ).toBe('/media/Series/Show');
  });

  it('gives a new season its own folder even when the held seasons are loose', () => {
    expect(
      seasonFolderOf('/media/Series/Show', 2, [{ season: 1, folder: '/media/Series/Show' }]),
    ).toBe('/media/Series/Show/Season 02');
  });

  it('names a new season folder the way the series names its others', () => {
    expect(
      seasonFolderOf('/media/Series/Show', 3, [
        { season: 1, folder: '/media/Series/Show/Season 1' },
        { season: 2, folder: '/media/Series/Show/Season 2' },
      ]),
    ).toBe('/media/Series/Show/Season 3');

    expect(
      seasonFolderOf('/media/Series/Show', 12, [
        { season: 1, folder: '/media/Series/Show/season 1' },
      ]),
    ).toBe('/media/Series/Show/season 12');

    expect(
      seasonFolderOf('/media/Series/Show', 3, [
        { season: 1, folder: '/media/Series/Show/Season 01' },
      ]),
    ).toBe('/media/Series/Show/Season 03');
  });

  it('pads when the only numbered folders are past nine', () => {
    expect(
      seasonFolderOf('/media/Series/Show', 3, [
        { season: 10, folder: '/media/Series/Show/Season 10' },
      ]),
    ).toBe('/media/Series/Show/Season 03');
  });
});
