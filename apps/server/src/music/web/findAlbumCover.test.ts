import { describe, expect, it, vi } from 'vitest';
import { findAlbumCover } from './findAlbumCover';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { MusicWeb } from './createMusicWeb';

const COVER = new Uint8Array([9, 9, 9]);

const aWeb = (
  json: (url: string) => JsonValue | null = () => null,
  bytes: Uint8Array | null = null,
) => {
  const web = {
    json: vi.fn((url: string) => Promise.resolve(json(url))),
    bytes: vi.fn((): Promise<Uint8Array | null> => Promise.resolve(bytes)),
  };

  return web satisfies MusicWeb;
};

describe('findAlbumCover', () => {
  it('asks for the cover of the release an album is tagged with', async () => {
    const web = aWeb(undefined, COVER);

    expect(
      await findAlbumCover(web, {
        title: 'Arcadia',
        artistName: 'Sleep Token',
        musicbrainzId: 'r1',
      }),
    ).toBe(COVER);
    expect(web.bytes).toHaveBeenCalledWith('https://coverartarchive.org/release/r1/front-1200');
  });

  it('searches for an untagged album, and takes the cover of a sure match', async () => {
    const web = aWeb(() => ({ 'release-groups': [{ id: 'g1', score: 100 }] }), COVER);

    expect(
      await findAlbumCover(web, {
        title: 'Arcadia',
        artistName: 'Sleep Token',
        musicbrainzId: null,
      }),
    ).toBe(COVER);
    expect(web.json).toHaveBeenCalledWith(
      expect.stringContaining('releasegroup%3A%22Arcadia%22%20AND%20artist%3A%22Sleep%20Token%22'),
    );
    expect(web.bytes).toHaveBeenCalledWith(
      'https://coverartarchive.org/release-group/g1/front-1200',
    );
  });

  it('leaves an album without a cover rather than taking a near miss', async () => {
    const web = aWeb(() => ({ 'release-groups': [{ id: 'g1', score: 60 }] }));

    expect(
      await findAlbumCover(web, { title: 'Arcadia', artistName: 'x', musicbrainzId: null }),
    ).toBeNull();
    expect(web.bytes).not.toHaveBeenCalled();
  });

  it('searches for a name with quotation marks in it as it is', async () => {
    const web = aWeb();

    await findAlbumCover(web, { title: 'The "Best"', artistName: 'x', musicbrainzId: null });

    expect(web.json).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('"The \\"Best\\""')),
    );
  });

  it('searches again without the year a ripper put on the title', async () => {
    const web = aWeb(
      (url) =>
        url.includes('2005')
          ? { 'release-groups': [] }
          : { 'release-groups': [{ id: 'g2', score: 100 }] },
      COVER,
    );

    expect(
      await findAlbumCover(web, {
        title: 'Silent Alarm 2005',
        artistName: 'Bloc Party',
        musicbrainzId: null,
      }),
    ).toBe(COVER);
    expect(web.bytes).toHaveBeenCalledWith(
      'https://coverartarchive.org/release-group/g2/front-1200',
    );
  });
});
