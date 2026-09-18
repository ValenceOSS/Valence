import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createMusicFileSystem } from './createMusicFileSystem';

const aLibrary = async () => {
  const root = await mkdtemp(join(tmpdir(), 'valence-music-'));
  const album = join(root, 'Artist', 'Album');

  await mkdir(album, { recursive: true });

  return { root, album };
};

describe('createMusicFileSystem', () => {
  it('reads lyrics kept beside a track under its name', async () => {
    const { album } = await aLibrary();

    await writeFile(join(album, '01. Song.lrc'), '[00:01.00]Words');

    await expect(
      createMusicFileSystem().readSidecarLyrics(join(album, '01. Song.flac')),
    ).resolves.toBe('[00:01.00]Words');
  });

  it('reads plain lyrics where there is no LRC', async () => {
    const { album } = await aLibrary();

    await writeFile(join(album, 'Song.txt'), 'Words');

    await expect(createMusicFileSystem().readSidecarLyrics(join(album, 'Song.mp3'))).resolves.toBe(
      'Words',
    );
  });

  it('has no lyrics where nothing is kept beside the track', async () => {
    const { album } = await aLibrary();

    await expect(
      createMusicFileSystem().readSidecarLyrics(join(album, 'Song.mp3')),
    ).resolves.toBeNull();
  });

  it('finds the cover kept in an album’s folder', async () => {
    const { album } = await aLibrary();

    await writeFile(join(album, 'Cover.JPG'), 'x');
    await writeFile(join(album, 'back.jpg'), 'x');

    await expect(createMusicFileSystem().findFolderArt(album)).resolves.toBe(
      join(album, 'Cover.JPG'),
    );
  });

  it('finds an artist’s picture in the folder above their albums', async () => {
    const { root, album } = await aLibrary();

    await writeFile(join(root, 'Artist', 'artist.png'), 'x');

    await expect(createMusicFileSystem().findArtistImage(album)).resolves.toBe(
      join(root, 'Artist', 'artist.png'),
    );
  });

  it('does not take a cover in the folder above for the artist', async () => {
    const { root, album } = await aLibrary();

    await writeFile(join(root, 'Artist', 'folder.jpg'), 'x');

    await expect(createMusicFileSystem().findArtistImage(album)).resolves.toBeNull();
  });
});
