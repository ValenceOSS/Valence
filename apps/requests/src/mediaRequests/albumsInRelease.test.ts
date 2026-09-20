import { describe, expect, it } from 'vitest';
import { spacedName } from '@ValenceRequests/releases/spacedName';
import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import { albumsInRelease } from './albumsInRelease';

const NO_ALIASES: string[] = [];

const PINK_FLOYD = { title: 'Pink Floyd', artistName: 'Pink Floyd', aliases: NO_ALIASES };

const ALBUMS = [
  { id: 'moon', title: 'The Dark Side of the Moon' },
  { id: 'wall', title: 'The Wall' },
  { id: 'wish', title: 'Wish You Were Here' },
];

/**
 * The albums a release, by its whole name, holds of Pink Floyd's.
 */
const heldBy = (name: string, request = PINK_FLOYD, isArtistChecked = true) =>
  albumsInRelease(request, ALBUMS, parseReleaseName(name).title, isArtistChecked).map(
    (album) => album.id,
  );

describe('albumsInRelease', () => {
  it('finds the album a release names, whatever edition or year it is', () => {
    expect(heldBy('Pink Floyd - The Dark Side of the Moon (1973) [FLAC 24-96]')).toEqual(['moon']);
    expect(
      heldBy(
        'Pink Floyd - The Dark Side Of The Moon (50th Anniversary Edition) (2023) [24Bit-192kHz] FLAC [PMEDIA]',
      ),
    ).toEqual(['moon']);
    expect(heldBy('Pink Floyd - Wish You Were Here (2011 Remaster) [MP3 320]')).toEqual(['wish']);
  });

  it('reads scene names, where dashes join the artist, album and tags', () => {
    expect(heldBy('Pink_Floyd-The_Wall-REMASTERED-2CD-FLAC-2011-GRP')).toEqual(['wall']);
    expect(spacedName('Pink_Floyd-The_Wall')).toBe('Pink Floyd-The Wall');
  });

  it('keeps an artist whose name has a dash of its own', () => {
    expect(
      albumsInRelease(
        { title: 'Jay-Z', artistName: 'Jay-Z', aliases: [] },
        [{ id: 'blueprint', title: 'The Blueprint' }],
        parseReleaseName('Jay-Z - The Blueprint (2001) [FLAC]').title,
      ).map((album) => album.id),
    ).toEqual(['blueprint']);
  });

  it('leaves out another artist, or an album not waited for', () => {
    expect(heldBy('Roger Waters - The Wall Live in Berlin (1990) [FLAC]')).toEqual([]);
    expect(heldBy('Pink Floyd - Animals (1977) [FLAC]')).toEqual([]);
    expect(heldBy('The Dark Side of the Moon')).toEqual([]);
  });

  it('matches an artist by another name they go by', () => {
    expect(
      heldBy('The Pink Floyd - The Wall (1979) [FLAC]', {
        ...PINK_FLOYD,
        aliases: ['The Pink Floyd'],
      }),
    ).toEqual(['wall']);
  });

  it('checks only the album of a release picked by hand', () => {
    expect(heldBy('Various - The Wall (1979) [FLAC]', PINK_FLOYD, false)).toEqual(['wall']);
  });
});
