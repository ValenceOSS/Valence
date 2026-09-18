import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { readTrackTags } from './readTrackTags';
import type { MusicFileSystem } from './scanMusicLibrary';

const LYRIC_EXTENSIONS = ['.lrc', '.txt'] as const;

const FOLDER_ART = /^(cover|folder|front|album)\.(jpe?g|png|webp)$/i;

const ARTIST_IMAGE = /^artist\.(jpe?g|png|webp)$/i;

/**
 * Finds the first file in a folder whose name matches, in the order a listing gives them.
 *
 * @param folder - Where to look.
 * @param pattern - What the file is called.
 * @returns Where it is, or nothing.
 */
const findNamed = async (folder: string, pattern: RegExp): Promise<string | null> => {
  const names = await readdir(folder).catch(() => []);
  const found = names.find((name) => pattern.test(name));

  return found === undefined ? null : join(folder, found);
};

/**
 * What a music scan reads beyond the list of files: each track's tags, and what is kept beside it —
 * lyrics named after the track, a cover image in the album's folder, and a picture of the artist in
 * the folder above, which is where Plex, Jellyfin and every tagger put them.
 *
 * @returns The reads a music scan makes of the disk, apart from listing it.
 */
const createMusicFileSystem = (): Omit<MusicFileSystem, 'listFiles'> => ({
  readTags: readTrackTags,

  readSidecarLyrics: async (path) => {
    const stem = join(dirname(path), basename(path, extname(path)));

    for (const extension of LYRIC_EXTENSIONS) {
      const text = await readFile(`${stem}${extension}`, 'utf8').catch(() => null);

      if (text !== null && text.trim() !== '') {
        return text;
      }
    }

    return null;
  },

  findFolderArt: (folder) => findNamed(folder, FOLDER_ART),

  findArtistImage: (albumFolder) => findNamed(dirname(albumFolder), ARTIST_IMAGE),
});

export { createMusicFileSystem };
