import type { Said } from '@ValenceI18n/SaidSchema';
import { rename, unlink } from 'node:fs/promises';
import { dirname, extname } from 'node:path';
import { TEXT_SUBTITLE_EXTENSIONS } from '@ValenceContracts/constants/TEXT_SUBTITLE_EXTENSIONS';
import { VIDEO_FILE_EXTENSIONS } from '@ValenceContracts/constants/VIDEO_FILE_EXTENSIONS';
import { findDownloadedFiles } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import { libraryFileOf } from '@ValenceRequests/mediaRequests/libraryFileOf';
import { placeFile } from '@ValenceRequests/mediaRequests/placeFile';
import { qualityTagOf } from '@ValenceRequests/mediaRequests/qualityTagOf';
import { qualityFromProbe } from '@ValenceRequests/media/qualityFromProbe';
import { parseReleaseName } from '@ValenceCore/releases/parseReleaseName';
import { matchAnimeRelease } from '@ValenceRequests/mediaRequests/matchAnimeRelease';
import type { DownloadedFile } from '@ValenceRequests/mediaRequests/findDownloadedFiles';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { ParsedRelease } from '@ValenceContracts/schemas/ParsedRelease';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';
import type { ProbeClient } from '@ValenceRequests/media/createProbeClient';

const BEING_CHECKED = '.checking';

type Fileable = Pick<
  RequestItemRecord,
  | 'id'
  | 'season'
  | 'episode'
  | 'title'
  | 'airDate'
  | 'filePath'
  | 'releaseTitle'
  | 'versionProfileId'
>;

type Filed = {
  filed: ReadonlyMap<string, string>;
  missing: readonly string[];
  refused: ReadonlyMap<string, Said>;
};

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
 * What a video is said to be, by its own name and by the name of the release it came in — which
 * answers for whatever its own leaves out, a pack's files often being numbered and nothing more
 * while the release around them names the lot.
 *
 * @param videoName - The video file's name.
 * @param releaseTitle - The name of the release it came in, where it is known.
 * @returns What the names say it is.
 */
const saidOf = (videoName: string, releaseTitle: string | null): ParsedRelease => {
  const own = parseReleaseName(stemOf(videoName));

  if (releaseTitle === null) {
    return own;
  }

  const release = parseReleaseName(releaseTitle);

  return {
    ...own,
    resolution: own.resolution ?? release.resolution,
    source: own.source ?? release.source,
    codec: own.codec ?? release.codec,
    audio: own.audio.length === 0 ? release.audio : own.audio,
    audioChannels: own.audioChannels ?? release.audioChannels,
  };
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
 * Which of a download's episodes one of its anime files holds, however it numbers them: read the
 * way its release as a whole was, as a batch numbers each of its files alike; as its name reads with
 * the show's or a cour's name in it, and otherwise by its numbers alone; and where its numbers could
 * still mean more than one set of episodes, the one reading that holds only episodes the download
 * was fetched for.
 *
 * @param request - What was asked for, its cours and how each release group numbers its releases.
 * @param items - The episodes the download was fetched for.
 * @param parsed - What the file's name says.
 * @param name - The file's name.
 * @returns The episodes it holds.
 */
const animeEpisodesOf = (
  request: Pick<MediaRequestRecord, 'title' | 'aliases' | 'anime' | 'numberingByGroup'>,
  items: readonly Fileable[],
  parsed: ParsedRelease,
  name: string,
): { season: number | null; episode: number | null }[] => {
  const releaseTitle = items.find((item) => item.releaseTitle !== null)?.releaseTitle ?? null;
  const readAs = (isTitleChecked: boolean) =>
    releaseTitle === null
      ? null
      : matchAnimeRelease(
          request,
          items,
          parseReleaseName(releaseTitle),
          releaseTitle,
          null,
          isTitleChecked,
        );
  const titled = readAs(true);
  const asReleased = titled === null || titled.kind === 'none' ? readAs(false) : titled;
  const numbering = asReleased?.kind === 'matched' ? asReleased.numbering : null;
  const named = matchAnimeRelease(request, items, parsed, name, null, true, numbering);
  const found =
    named.kind === 'none'
      ? matchAnimeRelease(request, items, parsed, name, null, false, numbering)
      : named;

  if (found.kind === 'matched') {
    return found.items;
  }

  if (found.kind === 'none') {
    return [];
  }

  const fitting = found.readings.filter((reading) =>
    reading.episodes.every((one) =>
      items.some((item) => item.season === one.season && item.episode === one.episode),
    ),
  );

  return fitting.length === 1 ? (fitting[0]?.episodes ?? []) : [];
};

/**
 * Which downloaded video holds one film or episode: a film is the largest, and an episode the one
 * whose name numbers it, or aired that day, in any of the ways anime numbers its episodes — or the
 * only video, where only one episode was asked of the download.
 *
 * @param item - The film or episode.
 * @param videos - The videos downloaded.
 * @param isOnlyItem - Whether it is the only thing asked of the download.
 * @param request - What was asked for, with an anime's cours.
 * @param items - Everything the download was fetched for.
 * @returns The video, or null where none holds it.
 */
const videoFor = (
  item: Fileable,
  videos: readonly DownloadedFile[],
  isOnlyItem: boolean,
  request: Pick<MediaRequestRecord, 'title' | 'aliases' | 'anime' | 'numberingByGroup'>,
  items: readonly Fileable[],
): DownloadedFile | null => {
  if (item.season === null || item.episode === null || (isOnlyItem && videos.length === 1)) {
    return largestOf(videos);
  }

  return largestOf(
    videos.filter((video) => {
      const parsed = parseReleaseName(stemOf(video.name));

      return (request.anime ?? null) !== null
        ? animeEpisodesOf(request, items, parsed, video.name).some(
            (one) => one.season === item.season && one.episode === item.episode,
          )
        : (parsed.seasons[0] === item.season && parsed.episodes.includes(item.episode ?? -1)) ||
            (item.airDate !== null && parsed.airDate === item.airDate);
    }),
  );
};

/**
 * Files what a finished download holds into the library: each film or episode it was fetched for
 * is found among its videos — a video holding several episodes, such as a double episode, filed
 * once and named for all of them — named as the library's scanner reads without guessing — and saying
 * what this copy is, its resolution, source, codec and audio — and placed, linked, copied or moved,
 * with any subtitles beside it that share its name. Whatever it replaces, as an upgrade does, is
 * removed once everything is filed, and only where every item it held was filed again, so a file
 * two episodes share is not removed when this download held only one of them.
 *
 * @param request - What was asked for.
 * @param items - The films or episodes the download was fetched for.
 * @param contentPath - Where the download is, as this service sees it.
 * @param isKeepingSource - Whether the download must keep its files, as a seeding torrent must.
 * @param probe - How to ask what a filed video actually is; answers nothing where none is set up.
 * @param refuses - Says why a video is not what was asked for, judged by what it is found to be —
 *   its resolution measured where it could be probed, and otherwise as its name says — or nothing
 *   where it is. Each video is checked beside where it goes, under a name of its own, and moved into
 *   place only once it is taken, so a copy it would replace is never lost to one that is refused.
 * @returns Where each was filed, which could not be found in it, and which were refused and why.
 */
const fileDownload = async (
  request: Pick<
    MediaRequestRecord,
    'libraryPath' | 'libraryFolder' | 'seasonFolders' | 'title' | 'year'
  > &
    Partial<Pick<MediaRequestRecord, 'aliases' | 'anime' | 'numberingByGroup'>>,
  items: readonly Fileable[],
  contentPath: string,
  isKeepingSource: boolean,
  probe: ProbeClient = () => Promise.resolve(null),
  refuses: (found: Partial<ParsedRelease>) => Said | null = () => null,
): Promise<Filed> => {
  const files = await findDownloadedFiles(contentPath);
  const videos = files.filter(isFeature);
  const filed = new Map<string, string>();
  const missing: string[] = [];
  const refused = new Map<string, Said>();

  const found = items.map((item) => ({
    item,
    video: videoFor(
      item,
      videos,
      items.length === 1,
      { ...request, aliases: request.aliases ?? [] },
      items,
    ),
  }));
  const together = new Map<string, Fileable[]>();

  for (const { item, video } of found) {
    if (video === null) {
      missing.push(item.id);
    } else {
      const key = item.season === null ? `${video.path}\n${item.id}` : video.path;

      together.set(key, [...(together.get(key) ?? []), item]);
    }
  }

  for (const held of together.values()) {
    const [item, ...others] = held.toSorted(
      (left, right) =>
        (left.season ?? 0) - (right.season ?? 0) || (left.episode ?? 0) - (right.episode ?? 0),
    );
    const video = found.find((one) => one.item.id === item?.id)?.video ?? null;

    if (item === undefined || video === null) {
      continue;
    }

    const last = others.at(-1);
    const lastEpisode =
      last !== undefined && last.season === item.season ? (last.episode ?? null) : null;
    const said = saidOf(video.name, item.releaseTitle);
    const extension = extensionOf(video.name);
    const placed = libraryFileOf(request, item, extension, qualityTagOf(said), lastEpisode);
    const videoStem = stemOf(video.name);

    const checking = `${placed}${BEING_CHECKED}`;

    await placeFile(video.path, checking, isKeepingSource);

    const probed = await probe(checking);
    const refusal = refuses({ ...said, ...(probed === null ? {} : qualityFromProbe(probed)) });

    if (refusal !== null) {
      await unlink(checking).catch(() => undefined);

      for (const one of held) {
        refused.set(one.id, refusal);
      }

      continue;
    }

    const destination =
      probed === null
        ? placed
        : libraryFileOf(
            request,
            item,
            extension,
            qualityTagOf({ ...said, ...qualityFromProbe(probed) }),
            lastEpisode,
          );

    await rename(checking, destination);

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

    for (const one of held) {
      filed.set(one.id, destination);
    }
  }

  const placedNow = new Set(filed.values());
  const replaced = new Set(
    items.flatMap((item) => (item.filePath === null ? [] : [item.filePath])),
  );

  for (const path of replaced) {
    const isLetGo = items.every((item) => item.filePath !== path || filed.has(item.id));

    if (isLetGo && !placedNow.has(path)) {
      await unlink(path).catch(() => undefined);
    }
  }

  return { filed, missing, refused };
};

export { fileDownload };
