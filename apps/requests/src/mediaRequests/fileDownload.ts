import { unlink } from 'node:fs/promises';
import { dirname, extname } from 'node:path';
import { TEXT_SUBTITLE_EXTENSIONS } from '@ValenceContracts/constants/TEXT_SUBTITLE_EXTENSIONS';
import { VIDEO_FILE_EXTENSIONS } from '@ValenceContracts/constants/VIDEO_FILE_EXTENSIONS';
import { findDownloadedFiles } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import { libraryFileOf } from '@ValenceRequests/mediaRequests/libraryFileOf';
import { placeFile } from '@ValenceRequests/mediaRequests/placeFile';
import { qualityTagOf } from '@ValenceRequests/mediaRequests/qualityTagOf';
import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import type { DownloadedFile } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type Fileable = Pick<
  RequestItemRecord,
  'id' | 'season' | 'episode' | 'title' | 'airDate' | 'filePath' | 'releaseTitle'
>;

type Filed = { filed: ReadonlyMap<string, string>; missing: readonly string[] };

/**
 * A file's extension, lower case and without its dot.
 *
 * @param name - The file's name.
 * @returns Its extension.
 */
const extensionOf = (name: string): string => extname(name).slice(1).toLowerCase();

/**
 * A file's name without its extension.
 *
 * @param name - The file's name.
 * @returns Its stem.
 */
const stemOf = (name: string): string => name.slice(0, name.length - extname(name).length);

/**
 * What a video is, for its own name to say: read from the file's name, and from the name of the
 * release it came in for whatever its own name leaves out — which a pack's files often do, being
 * numbered and nothing more, while the release around them names the lot.
 *
 * @param videoName - The video file's name.
 * @param releaseTitle - The name of the release it came in, where it is known.
 * @returns The tag, as `qualityTagOf` gives it.
 */
const qualityOf = (videoName: string, releaseTitle: string | null): string => {
  const own = parseReleaseName(stemOf(videoName));

  if (releaseTitle === null) {
    return qualityTagOf(own);
  }

  const release = parseReleaseName(releaseTitle);

  return qualityTagOf({
    ...own,
    resolution: own.resolution ?? release.resolution,
    source: own.source ?? release.source,
    codec: own.codec ?? release.codec,
    audio: own.audio.length === 0 ? release.audio : own.audio,
    audioChannels: own.audioChannels ?? release.audioChannels,
  });
};

/**
 * Whether a file is a video worth filing, rather than a sample of one.
 *
 * @param file - The file.
 * @returns Whether it is.
 */
const isFeature = (file: DownloadedFile): boolean =>
  VIDEO_FILE_EXTENSIONS.has(extensionOf(file.name)) &&
  !/\bsample\b/i.test(file.name) &&
  !/(^|\/)samples?(\/|$)/i.test(dirname(file.path));

/**
 * The largest of some files, which among a film's is the film itself.
 *
 * @param files - The files.
 * @returns The largest, or null where there are none.
 */
const largestOf = (files: readonly DownloadedFile[]): DownloadedFile | null =>
  files.toSorted((left, right) => right.sizeBytes - left.sizeBytes)[0] ?? null;

/**
 * Which downloaded video holds one film or episode: a film is the largest, and an episode the one
 * whose name numbers it, or aired that day — or the only video, where only one episode was asked of
 * the download.
 *
 * @param item - The film or episode.
 * @param videos - The videos downloaded.
 * @param isOnlyItem - Whether it is the only thing asked of the download.
 * @returns The video, or null where none holds it.
 */
const videoFor = (
  item: Fileable,
  videos: readonly DownloadedFile[],
  isOnlyItem: boolean,
): DownloadedFile | null => {
  if (item.season === null || item.episode === null || (isOnlyItem && videos.length === 1)) {
    return largestOf(videos);
  }

  return largestOf(
    videos.filter((video) => {
      const parsed = parseReleaseName(stemOf(video.name));

      return (
        (parsed.seasons[0] === item.season && parsed.episodes.includes(item.episode ?? -1)) ||
        (item.airDate !== null && parsed.airDate === item.airDate)
      );
    }),
  );
};

/**
 * Files what a finished download holds into the library: each film or episode it was fetched for
 * is found among its videos, named as the library's scanner reads without guessing — and saying
 * what this copy is, its resolution, source, codec and audio — and placed, linked, copied or moved,
 * with any subtitles beside it that share its name. Whatever it replaces, as an upgrade does, is
 * removed.
 *
 * @param request - What was asked for.
 * @param items - The films or episodes the download was fetched for.
 * @param contentPath - Where the download is, as this service sees it.
 * @param isKeepingSource - Whether the download must keep its files, as a seeding torrent must.
 * @returns Where each was filed, and which could not be found in it.
 */
const fileDownload = async (
  request: Pick<MediaRequestRecord, 'libraryPath' | 'title' | 'year'>,
  items: readonly Fileable[],
  contentPath: string,
  isKeepingSource: boolean,
): Promise<Filed> => {
  const files = await findDownloadedFiles(contentPath);
  const videos = files.filter(isFeature);
  const filed = new Map<string, string>();
  const missing: string[] = [];

  for (const item of items) {
    const video = videoFor(item, videos, items.length === 1);

    if (video === null) {
      missing.push(item.id);
      continue;
    }

    const destination = libraryFileOf(
      request,
      item,
      extensionOf(video.name),
      qualityOf(video.name, item.releaseTitle),
    );
    const videoStem = stemOf(video.name);

    await placeFile(video.path, destination, isKeepingSource);

    for (const subtitle of files.filter(
      (file) =>
        TEXT_SUBTITLE_EXTENSIONS.has(extensionOf(file.name)) &&
        file.name.startsWith(videoStem) &&
        dirname(file.path).startsWith(dirname(video.path)),
    )) {
      await placeFile(
        subtitle.path,
        `${stemOf(destination)}${subtitle.name.slice(videoStem.length)}`,
        isKeepingSource,
      );
    }

    if (item.filePath !== null && item.filePath !== destination) {
      await unlink(item.filePath).catch(() => undefined);
    }

    filed.set(item.id, destination);
  }

  return { filed, missing };
};

export { fileDownload };
