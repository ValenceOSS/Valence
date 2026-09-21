import { describe, expect, it } from 'vitest';
import { groupReleases } from '@ValenceScreens/requests/groupReleases';
import type { CatalogueAlbum, ReleaseType } from '@ValenceContracts/schemas/MediaRequest';

let counted = 0;

const aRelease = (
  title: string,
  type: ReleaseType | null,
  firstReleased: string | null = null,
): CatalogueAlbum => {
  counted += 1;

  return {
    id: `6ba7b810-9dad-11d1-80b4-00c04fd4300${counted.toString(16)}`,
    title,
    type,
    firstReleased,
  };
};

describe('groupReleases', () => {
  it('splits releases by what each one is, in the order the kinds are offered', () => {
    const groups = groupReleases([
      aRelease('A single', 'single'),
      aRelease('An album', 'album'),
      aRelease('A live record', 'live'),
      aRelease('An EP', 'ep'),
    ]);

    expect(groups.map((group) => group.title)).toEqual(['Albums', 'EPs', 'Singles', 'Live']);
  });

  it('puts the newest of each kind first', () => {
    const [albums] = groupReleases([
      aRelease('Older', 'album', '1973-03-01'),
      aRelease('Newer', 'album', '1979-11-30'),
    ]);

    expect(albums?.albums.map((album) => album.title)).toEqual(['Newer', 'Older']);
  });

  it('leaves out a kind the artist has none of', () => {
    const groups = groupReleases([aRelease('An album', 'album')]);

    expect(groups.map((group) => group.title)).toEqual(['Albums']);
  });

  it('keeps a release the catalogue has not typed, at the end', () => {
    const groups = groupReleases([aRelease('Untyped', null), aRelease('An album', 'album')]);

    expect(groups.map((group) => group.title)).toEqual(['Albums', 'Other releases']);
    expect(groups.at(-1)?.albums.map((album) => album.title)).toEqual(['Untyped']);
  });

  it('has nothing to show for an artist with no releases', () => {
    expect(groupReleases([])).toEqual([]);
  });
});
