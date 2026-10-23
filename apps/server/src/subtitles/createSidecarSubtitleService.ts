import { cuesOfScript } from './cuesOfScript';
import { STYLED_FORMATS } from './STYLED_FORMATS';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { Said } from '@ValenceI18n/SaidSchema';
import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { toWebVtt } from '@ValenceCore/functions/toWebVtt';
import { decodeSubtitle } from './decodeSubtitle';
import { describeSubtitleCharset } from './describeSubtitleCharset';
import {
  findSidecarSubtitles,
  isBitmapSubtitle,
  splitName,
  SUBTITLE_DIRECTORIES,
} from './findSidecarSubtitles';
import { trackId } from './SubtitleService';
import type { SubtitleService, SubtitleTrack } from './SubtitleService';
import type { SidecarFile, SidecarSubtitle } from './findSidecarSubtitles';
import { saying } from '@ValenceI18n/saying';
import { readStackPart } from '@ValenceServer/library/naming/readStackPart';
import type { MediaPart } from '@ValenceServer/transcoder/TranscoderClient';
import { joinAdvancedSubStation } from './joinAdvancedSubStation';
import { joinWebVtt } from './joinWebVtt';

type MediaPathLookup = {
  findPath: (mediaId: string) => Promise<string | null>;
  findParts?: (mediaId: string) => Promise<readonly MediaPart[]>;
};

type KeyedSubtitle = SidecarSubtitle & { key: string | null };

type FoundSubtitle = SidecarSubtitle & {
  sources: readonly { path: string; offsetSeconds: number }[];
};

type CreateSidecarSubtitleServiceOptions = {
  media: MediaPathLookup;
  onProblem?: (path: string, reason: Said) => void;
};

/**
 * Lists a directory, treating one that cannot be read as empty. A subtitle folder that is missing or
 * unreadable should cost a viewer the subtitles in it, not the film.
 *
 * @param directory - The directory to list.
 * @returns Its filenames, or none where it could not be read.
 */
const listFiles = async (directory: string): Promise<SidecarFile[]> => {
  try {
    const entries = await readdir(directory, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => ({ path: join(directory, entry.name), name: entry.name }));
  } catch {
    return [];
  }
};

/**
 * Finds the directories people keep subtitles in beside a video — `Subs`, `Subtitles`, and the same
 * named after the file itself — since plenty of collections separate them rather than leaving them
 * alongside.
 *
 * @param directory - The video being played.
 * @returns The directories worth looking in.
 */
const findSubtitleDirectories = async (directory: string): Promise<string[]> => {
  try {
    const entries = await readdir(directory, { withFileTypes: true });

    return entries
      .filter((entry) => entry.isDirectory() && SUBTITLE_DIRECTORIES.has(entry.name.toLowerCase()))
      .map((entry) => join(directory, entry.name));
  } catch {
    return [];
  }
};

/**
 * Finds the folder inside a subtitle directory that is named after the video being played, which is
 * how a collection keeps one episode's subtitles apart from the rest of its season's.
 *
 * @param directory - The subtitle directory to look inside.
 * @param stem - The video's name, without its extension.
 * @returns The folder belonging to this video, or nothing where there is none.
 */
const findNamedChild = async (directory: string, stem: string): Promise<string | null> => {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const found = entries.find((entry) => entry.isDirectory() && entry.name === stem);

    return found === undefined ? null : join(directory, found.name);
  } catch {
    return null;
  }
};

/**
 * The subtitle files kept for one video, beside it and in the folders subtitles are kept in, each
 * with what it is called relative to the video — its tags, and which folder it is in — so the same
 * track kept for each part of a split film can be told to be one track. A file in a subtitle folder
 * that is not named for the video has no such name.
 *
 * @param videoPath - The video.
 * @returns Its subtitles, and the picture subtitles beside it.
 */
const discoverOne = async (
  videoPath: string,
): Promise<{ tracks: KeyedSubtitle[]; pictures: SidecarFile[] }> => {
  const directory = dirname(videoPath);
  const videoName = basename(videoPath);
  const { stem } = splitName(videoName);

  const inFolder = await listFiles(directory);
  const beside = findSidecarSubtitles(videoName, inFolder);

  const subtitleDirectories = await findSubtitleDirectories(directory);
  const named = await Promise.all(
    subtitleDirectories.map((subtitleDirectory) => findNamedChild(subtitleDirectory, stem)),
  );

  const nested = await Promise.all(
    [...subtitleDirectories, ...named.filter((one): one is string => one !== null)].map(
      async (subtitleDirectory) =>
        findSidecarSubtitles(videoName, await listFiles(subtitleDirectory), {
          fromSubtitleDirectory: true,
        }),
    ),
  );

  const keyOf = (track: SidecarSubtitle): string | null => {
    const folder = dirname(track.path);
    const name = basename(track.path);
    const fileStem = splitName(name).stem;
    const isNamedFolder = folder !== directory && basename(folder) === stem;
    const where =
      folder === directory
        ? ''
        : isNamedFolder
          ? `${basename(dirname(folder))}/*`
          : basename(folder);

    if (fileStem === stem || fileStem.startsWith(`${stem}.`)) {
      return `${where}/${fileStem.slice(stem.length)}.${track.format}`;
    }

    return isNamedFolder ? `${where}/${name}` : null;
  };

  return {
    tracks: [...beside, ...nested.flat()].map((track) => ({ ...track, key: keyOf(track) })),
    pictures: inFolder.filter(
      (file) => isBitmapSubtitle(file.name) && splitName(file.name).stem.startsWith(stem),
    ),
  };
};

/**
 * Subtitles read from the files sitting beside a video, converted to the one format a browser will
 * take. These are the tracks somebody downloaded themselves, and are usually better than what the
 * container holds.
 *
 * @param options - How to read the directory and the files in it.
 * @returns The subtitle service.
 */
const createSidecarSubtitleService = ({
  media,
  onProblem,
}: CreateSidecarSubtitleServiceOptions): SubtitleService => {
  /**
   * Reads one subtitle file as text, in whatever it was written in, reporting a guessed encoding and
   * a file that could not be read at all.
   *
   * @param track - The track to read.
   * @returns The text, or null where the file could not be read.
   */
  const readTrack = async (track: SidecarSubtitle): Promise<{ text: string } | null> => {
    try {
      const decoded = decodeSubtitle(await readFile(track.path), track.language);
      const guessed = describeSubtitleCharset(decoded);

      if (guessed !== null) {
        onProblem?.(track.path, guessed);
      }

      return { text: decoded.text };
    } catch (error) {
      onProblem?.(
        track.path,
        error instanceof Error
          ? sayVerbatim(error.message)
          : saying('server.subtitles.sidecarSubtitleService.unreadable'),
      );

      return null;
    }
  };

  /**
   * The subtitle tracks kept for a title. A film split across several files has the same track kept
   * for each part read as one track, each part's file starting where that part does, and a track
   * kept by the name its parts share read as one for the whole film.
   *
   * @param mediaId - The title.
   * @returns Its tracks, and the picture subtitles beside it, or nothing for no such title.
   */
  const discover = async (
    mediaId: string,
  ): Promise<{ tracks: FoundSubtitle[]; pictures: SidecarFile[] } | null> => {
    const videoPath = await media.findPath(mediaId);

    if (videoPath === null) {
      return null;
    }

    const parts = (await media.findParts?.(mediaId)) ?? [];

    if (parts.length <= 1) {
      const one = await discoverOne(videoPath);

      return {
        tracks: one.tracks.map((track) => ({
          ...track,
          sources: [{ path: track.path, offsetSeconds: 0 }],
        })),
        pictures: one.pictures,
      };
    }

    const found = await Promise.all(parts.map((part) => discoverOne(part.path)));
    const shared = readStackPart(basename(videoPath))?.name;
    const ofParts = new Set(found.flatMap((one) => one.tracks.map((track) => track.path)));
    const whole =
      shared === undefined
        ? []
        : findSidecarSubtitles(`${shared}.mkv`, await listFiles(dirname(videoPath))).filter(
            (track) => !ofParts.has(track.path),
          );
    const claimed = new Set(
      found.flatMap((one) =>
        one.tracks.filter((track) => track.key !== null).map((kept) => kept.path),
      ),
    );
    const grouped = new Map<string, FoundSubtitle>();
    const loose = new Map<string, FoundSubtitle>();
    let offsetSeconds = 0;

    for (const [at, one] of found.entries()) {
      for (const { key, ...track } of one.tracks) {
        if (key === null) {
          if (!claimed.has(track.path) && !loose.has(track.path)) {
            loose.set(track.path, { ...track, sources: [{ path: track.path, offsetSeconds: 0 }] });
          }

          continue;
        }

        const source = { path: track.path, offsetSeconds };
        const before = grouped.get(key);

        grouped.set(
          key,
          before === undefined
            ? { ...track, sources: [source] }
            : { ...before, sources: [...before.sources, source] },
        );
      }

      offsetSeconds += parts[at]?.durationSeconds ?? 0;
    }

    return {
      tracks: [
        ...grouped.values(),
        ...whole.map((track) => ({ ...track, sources: [{ path: track.path, offsetSeconds: 0 }] })),
        ...loose.values(),
      ],
      pictures: [
        ...new Map(found.flatMap((one) => one.pictures).map((file) => [file.path, file])).values(),
      ],
    };
  };

  /**
   * Reads every file of a track, each moved on to where its part starts, and joins them as the
   * track's format is joined, leaving out a file that cannot be read.
   *
   * @param track - The track.
   * @param join - How the files are joined, given each one's text in the format it is served in.
   * @param convert - What each file's text is turned into before it is joined.
   * @returns The joined track, or null where none of its files could be read.
   */
  const readJoined = async (
    track: FoundSubtitle,
    join: typeof joinWebVtt,
    convert: (text: string) => string,
  ): Promise<string | null> => {
    const read = await Promise.all(
      track.sources.map(async (source) => {
        const one = await readTrack({ ...track, path: source.path });

        return one === null
          ? []
          : [{ content: convert(one.text), offsetSeconds: source.offsetSeconds }];
      }),
    );
    const parts = read.flat();

    return parts.length === 0 ? null : join(parts);
  };

  /**
   * A styled track's script as the file holds it, for a player that draws it whole.
   *
   * @param mediaId - The title.
   * @param id - The track.
   * @returns The script, or nothing for a track with no styling.
   */
  const readScript = async (mediaId: string, id: string): Promise<string | null> => {
    const found = await discover(mediaId);
    const track = found?.tracks.find((candidate) => trackId(candidate.path) === id);

    if (track === undefined || !STYLED_FORMATS.has(track.format.toLowerCase())) {
      return null;
    }

    return readJoined(track, joinAdvancedSubStation, (text) => text);
  };

  return {
    list: async (mediaId) => {
      const found = await discover(mediaId);

      if (found === null) {
        return null;
      }

      for (const picture of found.pictures) {
        onProblem?.(
          picture.path,
          saying('server.subtitles.sidecarSubtitleService.aSubtitleHeldAsPicturesRather'),
        );
      }

      const tracks: SubtitleTrack[] = found.tracks.map((track) => ({
        id: trackId(track.path),
        language: track.language,
        label: track.label,
        format: track.format,
        isForced: track.isForced,
        isHearingImpaired: track.isHearingImpaired,
        delivery: 'text' as const,
        streamIndex: null,
      }));

      return tracks;
    },

    read: async (mediaId, id) => {
      const found = await discover(mediaId);
      const track = found?.tracks.find((candidate) => trackId(candidate.path) === id);

      if (track === undefined) {
        return null;
      }

      return readJoined(track, joinWebVtt, (text) => toWebVtt(text, track.format));
    },

    readScript,

    fileOf: async (mediaId, id) => {
      const track = (await discover(mediaId))?.tracks.find(
        (candidate) => trackId(candidate.path) === id,
      );
      const [only, ...more] = track?.sources ?? [];

      return only === undefined || more.length > 0 || only.offsetSeconds !== 0 ? null : only.path;
    },

    readCues: async (mediaId, id) => cuesOfScript(await readScript(mediaId, id)),
  };
};

export { createSidecarSubtitleService };
