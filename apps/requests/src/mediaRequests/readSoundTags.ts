import { parseFile } from 'music-metadata';

type SoundTags = {
  album: string | null;
  title: string | null;
  author: string | null;
  year?: number | null;
};

/**
 * What a track's own tags say of the book it belongs to, read without its pictures.
 *
 * @param path - The track.
 * @returns Its album, title and author, or nothing where it cannot be read.
 */
const readSoundTags = async (path: string): Promise<SoundTags | null> => {
  try {
    const { common } = await parseFile(path, { duration: false, skipCovers: true });

    return {
      album: common.album ?? null,
      title: common.title ?? null,
      author: common.albumartist ?? common.artist ?? null,
      year: common.year ?? null,
    };
  } catch {
    return null;
  }
};

export { readSoundTags };
export type { SoundTags };
