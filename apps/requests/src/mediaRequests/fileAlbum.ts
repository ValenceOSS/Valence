import { readdir, unlink } from 'node:fs/promises';
import { basename, dirname, extname, join } from 'node:path';
import { AUDIO_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIO_FILE_EXTENSIONS';
import { albumFolderOf } from '@ValenceRequests/mediaRequests/albumFolderOf';
import { findDownloadedFiles } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import { isSameTitle } from '@ValenceRequests/mediaRequests/isSameTitle';
import { placeFile } from '@ValenceRequests/mediaRequests/placeFile';
import { readAudioTags } from '@ValenceRequests/mediaRequests/readAudioTags';
import { safeFileName } from '@ValenceRequests/mediaRequests/safeFileName';
import type { AudioTags } from '@ValenceRequests/mediaRequests/AudioTags';
import type { DownloadedFile } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type Fileable = Pick<RequestItemRecord, 'id' | 'title' | 'airDate' | 'filePath'>;

type Filed = { filed: ReadonlyMap<string, string>; missing: readonly string[] };

type Track = { file: DownloadedFile; tags: AudioTags };

const COVER = /^(cover|folder|front|album)\.(jpe?g|png)$/i;

const LEADING_NUMBER = /^\s*(?:(\d{1,2})[-.])?(\d{1,3})\b[\s.\-_]*/;

/**
 * A file's extension, lower case and without its dot.
 *
 * @param name - The file's name.
 * @returns Its extension.
 */
const extensionOf = (name: string): string => extname(name).slice(1).toLowerCase();

/**
 * What most of an album's tracks say, where any say anything: the album's artist, title or year,
 * which a stray track tagged differently should not split in two.
 *
 * @param values - What each track says.
 * @returns The commonest, or null where none says.
 */
const commonest = <Value extends string | number>(
  values: readonly (Value | null)[],
): Value | null => {
  const counts = new Map<Value, number>();

  for (const value of values) {
    if (value !== null) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }

  return [...counts.entries()].toSorted((left, right) => right[1] - left[1])[0]?.[0] ?? null;
};

/**
 * Which of a download's tracks are one album's: those whose tags name it, whatever edition, or —
 * where none do, and it is the only album asked of the download, or nothing is tagged — every
 * track.
 *
 * @param item - The album.
 * @param tracks - The download's tracks.
 * @param isOnlyItem - Whether it is the only album asked of the download.
 * @returns Its tracks.
 */
const tracksOf = (item: Fileable, tracks: readonly Track[], isOnlyItem: boolean): Track[] => {
  const named = tracks.filter(
    (track) =>
      track.tags.album !== null &&
      (isSameTitle(track.tags.album, item.title) ||
        isSameTitle(track.tags.album.replace(/\s*[([][^()[\]]*[)\]]\s*$/, ''), item.title)),
  );

  if (named.length > 0) {
    return named;
  }

  return isOnlyItem || tracks.every((track) => track.tags.album === null) ? [...tracks] : [];
};

/**
 * A track's name in its album's folder: its place on the album, the disc first where there is more
 * than one, then its title — read from its tags, or from its file's name where they say nothing.
 *
 * @param track - The track.
 * @param isOnDiscs - Whether the album spans more than one disc.
 * @param place - Where it comes among the album's tracks, where nothing numbers it.
 * @returns Its name.
 */
const trackNameOf = (track: Track, isOnDiscs: boolean, place: number): string => {
  const stem = basename(track.file.name, extname(track.file.name));
  const numbered = LEADING_NUMBER.exec(stem);
  const number = track.tags.track ?? (numbered?.[2] === undefined ? place : Number(numbered[2]));
  const title = safeFileName(track.tags.title ?? stem.replace(LEADING_NUMBER, '')) || 'Track';
  const disc = isOnDiscs ? `${(track.tags.disc ?? 1).toString()}-` : '';

  return `${disc}${number.toString().padStart(2, '0')} - ${title}.${extensionOf(track.file.name)}`;
};

/**
 * Files the albums a finished download holds into a music library by what their tracks' tags say,
 * not by what the download's folder is called: each album into its artist's folder, named with its
 * year, and each track by its disc, place and title. A cover picture goes with them, from beside
 * the tracks or from the album's own folder above its discs. Where an album was here before, as an
 * upgrade replaces it, the tracks this did not bring are removed.
 *
 * @param request - The artist or album asked for.
 * @param items - The albums the download was fetched for.
 * @param contentPath - Where the download is, as this service sees it.
 * @param isKeepingSource - Whether the download must keep its files, as a seeding torrent must.
 * @param readTags - How a track's tags are read.
 * @returns The folder each album was filed into, and which could not be found in it.
 */
const fileAlbum = async (
  request: Pick<MediaRequestRecord, 'libraryPath' | 'title' | 'artistName'>,
  items: readonly Fileable[],
  contentPath: string,
  isKeepingSource: boolean,
  readTags: (path: string) => Promise<AudioTags> = readAudioTags,
): Promise<Filed> => {
  const files = await findDownloadedFiles(contentPath);
  const tracks = await Promise.all(
    files
      .filter((file) => AUDIO_FILE_EXTENSIONS.has(extensionOf(file.name)))
      .map(async (file) => ({ file, tags: await readTags(file.path) })),
  );
  const filed = new Map<string, string>();
  const missing: string[] = [];

  for (const item of items) {
    const own = tracksOf(item, tracks, items.length === 1).toSorted(
      (left, right) =>
        (left.tags.disc ?? 1) - (right.tags.disc ?? 1) ||
        (left.tags.track ?? 0) - (right.tags.track ?? 0) ||
        left.file.path.localeCompare(right.file.path),
    );

    if (own.length === 0) {
      missing.push(item.id);
      continue;
    }

    const folder = albumFolderOf(request.libraryPath, {
      artist:
        commonest(own.map((track) => track.tags.artist)) ?? request.artistName ?? request.title,
      title: commonest(own.map((track) => track.tags.album)) ?? item.title,
      year:
        commonest(own.map((track) => track.tags.year)) ??
        (item.airDate === null ? null : Number(item.airDate.slice(0, 4))),
    });
    const isOnDiscs = own.some((track) => (track.tags.disc ?? 1) > 1);
    const placed = new Set<string>();

    for (const [place, track] of own.entries()) {
      const destination = join(folder, trackNameOf(track, isOnDiscs, place + 1));

      await placeFile(track.file.path, destination, isKeepingSource);
      placed.add(destination);
    }

    const cover = files.find(
      (file) =>
        COVER.test(file.name) &&
        own.some((track) => `${dirname(track.file.path)}/`.startsWith(`${dirname(file.path)}/`)),
    );

    if (cover !== undefined) {
      await placeFile(
        cover.path,
        join(folder, `cover.${extensionOf(cover.name)}`),
        isKeepingSource,
      );
    }

    if (item.filePath !== null) {
      const before = await readdir(item.filePath).catch(() => []);

      for (const name of before) {
        const path = join(item.filePath, name);

        if (AUDIO_FILE_EXTENSIONS.has(extensionOf(name)) && !placed.has(path)) {
          await unlink(path).catch(() => undefined);
        }
      }
    }

    filed.set(item.id, folder);
  }

  return { filed, missing };
};

export { fileAlbum };
