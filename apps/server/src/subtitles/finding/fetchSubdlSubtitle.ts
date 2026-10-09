import { unzipSync } from 'fflate';
import { extname } from 'node:path';
import { TEXT_SUBTITLE_EXTENSIONS } from '@ValenceContracts/constants/TEXT_SUBTITLE_EXTENSIONS';
import { parseEpisodePath } from '@ValenceServer/library/naming/parseEpisodePath';
import type { DownloadedSubtitle } from './DownloadedSubtitle';

/**
 * The kind of subtitle a file in a zip is, by its extension, where it is one Valence reads.
 *
 * @param name - The file's name in the zip.
 * @returns Its extension, lowered, or nothing where it is not a subtitle.
 */
const subtitleKindOf = (name: string): string | null => {
  const extension = extname(name).slice(1).toLowerCase();

  return TEXT_SUBTITLE_EXTENSIONS.has(extension) ? extension : null;
};

/**
 * Downloads one subtitle from SubDL, which hands them out zipped, and reads the subtitle out of the
 * zip, as SubRip, WebVTT or ASS. A zip of a whole season holds one for every episode, so for an
 * episode the one named for it is taken; a zip whose only subtitle is named for another episode is
 * refused, since SubDL lists a release under episodes it does not hold. Otherwise the first
 * subtitle in it is taken.
 *
 * @param path - Where SubDL said the zip is, under its download address.
 * @param episode - The season and episode wanted, for an episode.
 * @param fetchImpl - The way out to the web.
 * @returns The subtitle as it was written, in whatever characters it uses, with its kind; that it
 *   is for another episode; or nothing where there was none to read.
 */
const fetchSubdlSubtitle = async (
  path: string,
  episode: { season: number; episode: number } | null,
  fetchImpl: typeof fetch = fetch,
): Promise<DownloadedSubtitle | null> => {
  if (!path.startsWith('/')) {
    return null;
  }

  const answer = await fetchImpl(`https://dl.subdl.com${path}`, {
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);

  if (answer?.ok !== true) {
    return null;
  }

  try {
    const files = unzipSync(new Uint8Array(await answer.arrayBuffer()));
    const subtitles = Object.keys(files)
      .toSorted()
      .filter((one) => subtitleKindOf(one) !== null);
    const isThisEpisode = (name: string): boolean | null => {
      const read = parseEpisodePath(name);

      return episode === null || !read.isSuccess || read.episodeNumber === null
        ? null
        : read.episodeNumber === episode.episode &&
            (read.seasonNumber === null || read.seasonNumber === episode.season);
    };
    const name =
      subtitles.find((one) => isThisEpisode(one) === true) ??
      subtitles.find((one) => isThisEpisode(one) === null);
    const bytes = name === undefined ? undefined : files[name];
    const extension = name === undefined ? null : subtitleKindOf(name);

    if (bytes === undefined || extension === null) {
      return subtitles.length > 0 ? { kind: 'otherEpisode' } : null;
    }

    return { kind: 'downloaded', bytes, extension };
  } catch {
    return null;
  }
};

export { fetchSubdlSubtitle };
