import { parseFile } from 'music-metadata';
import type { AudioTags } from '@ValenceRequests/mediaRequests/AudioTags';

/**
 * Reads what a downloaded track's tags say it is — its album's artist, the album, the year, and
 * its place and title on it — without its pictures or its length, which filing does not need.
 *
 * @param path - The track.
 * @returns Its tags, each missing where the file does not say, or all of them where it cannot be
 *   read.
 */
const readAudioTags = async (path: string): Promise<AudioTags> => {
  const meta = await parseFile(path, { skipCovers: true, duration: false }).catch(() => null);
  const common = meta?.common;
  const text = (value: string | undefined): string | null =>
    value === undefined || value.trim() === '' ? null : value.trim();

  return {
    artist: text(common?.albumartist) ?? text(common?.artist),
    album: text(common?.album),
    year: common?.year ?? null,
    disc: common?.disk.no ?? null,
    track: common?.track.no ?? null,
    title: text(common?.title),
  };
};

export { readAudioTags };
