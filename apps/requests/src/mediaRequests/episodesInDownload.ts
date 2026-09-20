import { extname } from 'node:path';
import { VIDEO_FILE_EXTENSIONS } from '@ValenceContracts/constants/VIDEO_FILE_EXTENSIONS';
import { findDownloadedFiles } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import type { ParsedRelease } from '@ValenceContracts/schemas/ParsedRelease';

type Episode = { id: string; season: number; episode: number };

/**
 * The episodes a finished download holds, read from the names of the videos in it — or, where it
 * is one video whose own name does not number it, from the release's name.
 *
 * @param contentPath - Where the download is.
 * @param release - What the release's name says.
 * @returns The episodes, each once, in order.
 */
const episodesInDownload = async (
  contentPath: string,
  release: ParsedRelease,
): Promise<Episode[]> => {
  const videos = (await findDownloadedFiles(contentPath)).filter(
    (file) =>
      VIDEO_FILE_EXTENSIONS.has(extname(file.name).slice(1).toLowerCase()) &&
      !/\bsample\b/i.test(file.name),
  );
  const numbered = videos.flatMap((video) => {
    const parsed = parseReleaseName(
      video.name.slice(0, video.name.length - extname(video.name).length),
    );
    const season = parsed.seasons[0];

    return season === undefined ? [] : parsed.episodes.map((episode) => ({ season, episode }));
  });
  const releaseSeason = release.seasons[0];
  const found =
    numbered.length > 0 || videos.length !== 1 || releaseSeason === undefined
      ? numbered
      : release.episodes.map((episode) => ({ season: releaseSeason, episode }));

  return [
    ...new Map(
      found.map((one) => [`${one.season.toString()}x${one.episode.toString()}`, one]),
    ).entries(),
  ]
    .map(([id, one]) => ({ id, ...one }))
    .toSorted((left, right) => left.season - right.season || left.episode - right.episode);
};

export type { Episode };

export { episodesInDownload };
