import { mkdtemp, readdir, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aWebThatAnswers } from '@ValenceServer/testing/aWebThatAnswers';
import { createCataloguePictures } from './createCataloguePictures';
import { findAppleAlbumCoverUrl } from './findAppleAlbumCoverUrl';
import { findAppleArtistPictureUrl } from './findAppleArtistPictureUrl';
import { findDeezerArtistPictureUrl } from './findDeezerArtistPictureUrl';
import type { CataloguePicture } from './createCataloguePictures';

vi.mock('./findAppleAlbumCoverUrl', () => ({ findAppleAlbumCoverUrl: vi.fn() }));
vi.mock('./findAppleArtistPictureUrl', () => ({ findAppleArtistPictureUrl: vi.fn() }));
vi.mock('./findDeezerArtistPictureUrl', () => ({ findDeezerArtistPictureUrl: vi.fn() }));

const ARCHIVED = 'https://coverartarchive.org/release-group/rg-1/front-500';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * A picture standing for whatever was read from an address.
 *
 * @param address - Where it was read from.
 * @returns The picture.
 */
const pictureOf = (address: string): CataloguePicture => ({
  body: new TextEncoder().encode(address).buffer,
  contentType: 'image/jpeg',
});

/**
 * The pictures, kept in a fresh folder, able to read only the addresses given.
 *
 * @param readable - The addresses that have a picture.
 * @param now - The time it is.
 * @returns The pictures, and what they read and where they keep what they found.
 */
const pictures = async (readable: readonly string[], now = () => 1_000_000_000_000) => {
  const directory = await mkdtemp(join(tmpdir(), 'valence-catalogue-'));
  const readImage = vi.fn((url: string) =>
    Promise.resolve(readable.includes(url) ? pictureOf(url) : null),
  );

  return {
    directory,
    readImage,
    found: createCataloguePictures({ directory, web: aWebThatAnswers({}), readImage, now }),
  };
};

const said = (picture: CataloguePicture | null): string | null =>
  picture === null ? null : new TextDecoder().decode(picture.body);

beforeEach(() => {
  vi.mocked(findAppleAlbumCoverUrl).mockReset().mockResolvedValue('https://apple/cover.jpg');
  vi.mocked(findDeezerArtistPictureUrl).mockReset().mockResolvedValue(null);
  vi.mocked(findAppleArtistPictureUrl).mockReset().mockResolvedValue(null);
});

describe('createCataloguePictures', () => {
  it('reads a cover from the Cover Art Archive', async () => {
    const { found } = await pictures([ARCHIVED]);

    expect(said(await found.cover('rg-1', { title: 'Intimacy', artist: 'Bloc Party' }))).toBe(
      ARCHIVED,
    );
    expect(findAppleAlbumCoverUrl).not.toHaveBeenCalled();
  });

  it('reads a cover from Apple’s catalogue where the archive has none', async () => {
    const { found } = await pictures(['https://apple/cover.jpg']);

    expect(said(await found.cover('rg-1', { title: 'Intimacy', artist: 'Bloc Party' }))).toBe(
      'https://apple/cover.jpg',
    );
    expect(findAppleAlbumCoverUrl).toHaveBeenCalledWith(expect.anything(), {
      title: 'Intimacy',
      artistName: 'Bloc Party',
    });
  });

  it('finds no cover where neither has one and there is nothing to search Apple with', async () => {
    const { found } = await pictures([]);

    expect(await found.cover('rg-1', null)).toBeNull();
    expect(findAppleAlbumCoverUrl).not.toHaveBeenCalled();
  });

  it('reads a release’s small cover from the archive, and its name’s from Apple otherwise', async () => {
    const release = 'https://coverartarchive.org/release/rel-1/front-250';
    const { found } = await pictures([release, 'https://apple/cover.jpg']);

    expect(said(await found.releaseCover('rel-1', { title: 'Isles', artist: 'Bicep' }))).toBe(
      release,
    );
    expect(findAppleAlbumCoverUrl).not.toHaveBeenCalled();
    expect(said(await found.releaseCover('rel-2', { title: 'Isles', artist: 'Bicep' }))).toBe(
      'https://apple/cover.jpg',
    );
    expect(await found.releaseCover('rel-3', null)).toBeNull();
  });

  it('reads the cover of a record known only by its name from Apple’s catalogue', async () => {
    const { found } = await pictures(['https://apple/cover.jpg']);

    expect(said(await found.namedCover({ title: 'Isles', artist: 'Bicep' }))).toBe(
      'https://apple/cover.jpg',
    );
    expect(findAppleAlbumCoverUrl).toHaveBeenCalledWith(expect.anything(), {
      title: 'Isles',
      artistName: 'Bicep',
    });
  });

  it('remembers where a cover was found, so it is not looked for again', async () => {
    const { found, readImage } = await pictures(['https://apple/cover.jpg']);
    const hint = { title: 'Intimacy', artist: 'Bloc Party' };

    await found.cover('rg-1', hint);
    await found.cover('rg-1', hint);

    expect(findAppleAlbumCoverUrl).toHaveBeenCalledTimes(1);
    expect(readImage).toHaveBeenLastCalledWith('https://apple/cover.jpg');
  });

  it('looks for a cover once when it is asked for twice at once', async () => {
    const { found, directory } = await pictures([ARCHIVED]);

    await Promise.all([found.cover('rg-1', null), found.cover('rg-1', null)]);

    expect(await readdir(directory)).toHaveLength(1);
  });

  it('remembers finding nothing for a week, then looks again', async () => {
    let now = Date.now();
    const { found } = await pictures([], () => now);
    const hint = { title: 'Intimacy', artist: 'Bloc Party' };

    await found.cover('rg-1', hint);
    await found.cover('rg-1', hint);

    expect(findAppleAlbumCoverUrl).toHaveBeenCalledTimes(1);

    now += 2 * WEEK_MS;
    await found.cover('rg-1', hint);

    expect(findAppleAlbumCoverUrl).toHaveBeenCalledTimes(2);
  });

  it('reads an artist’s face from Deezer first, then Apple Music', async () => {
    vi.mocked(findDeezerArtistPictureUrl).mockResolvedValue('https://deezer/face.jpg');
    vi.mocked(findAppleArtistPictureUrl).mockResolvedValue('https://apple/face.jpg');
    const { found } = await pictures(['https://apple/face.jpg']);

    expect(said(await found.artistPicture('Bloc Party', null))).toBe('https://apple/face.jpg');
  });

  it('shows the cover of a record of theirs where no face is found', async () => {
    const { found } = await pictures([ARCHIVED]);

    expect(said(await found.artistPicture('Bloc Party', 'rg-1'))).toBe(ARCHIVED);
    expect(await found.artistPicture('Bloc Party', null)).toBeNull();
  });

  it('knows an artist by their name however it is written', async () => {
    vi.mocked(findDeezerArtistPictureUrl).mockResolvedValue('https://deezer/face.jpg');
    const { found } = await pictures(['https://deezer/face.jpg']);

    await found.artistPicture('Bloc Party', null);
    await found.artistPicture('bloc party', null);

    expect(findDeezerArtistPictureUrl).toHaveBeenCalledTimes(1);
  });

  it('forgets an old memory of nothing by the file’s own time', async () => {
    const { found, directory } = await pictures([], () => Date.now());

    await found.cover('rg-2', null);

    const [file] = await readdir(directory);
    const longAgo = new Date(Date.now() - 2 * WEEK_MS);

    await utimes(join(directory, file ?? ''), longAgo, longAgo);
    vi.mocked(findAppleAlbumCoverUrl).mockClear();
    await found.cover('rg-2', { title: 'A', artist: 'B' });

    expect(findAppleAlbumCoverUrl).toHaveBeenCalledTimes(1);
  });
});
