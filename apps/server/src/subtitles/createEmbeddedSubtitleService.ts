import { cuesOfScript } from './cuesOfScript';
import { STYLED_FORMATS } from './STYLED_FORMATS';
import { say } from '@ValenceI18n/say';
import { saying } from '@ValenceI18n/saying';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { Said } from '@ValenceI18n/SaidSchema';
import { describeLanguage, readLanguage } from '@ValenceCore/functions/describeTrack';
import { isImageSubtitle } from '@ValenceCore/functions/isImageSubtitle';
import { trackId } from './SubtitleService';
import type { SubtitleService, SubtitleTrack } from './SubtitleService';
import { describeFailure } from '@ValenceServer/logging/describeFailure';

// oxlint-disable-next-line valence/no-hard-coded-strings -- words matched in a track's title
const HEARING_IMPAIRED_MARKERS = ['sdh', 'cc', 'hearing', 'hard of hearing'];

const UNREADABLE = new Set(['unknown']);

type EmbeddedStream = {
  index: number;
  format: string;
  language?: string | null | undefined;
  title?: string | null | undefined;
  isForced: boolean;
};

type EmbeddedLookup = {
  find: (mediaId: string) => Promise<{ path: string; streams: EmbeddedStream[] } | null>;
};

type Extractor = {
  readSubtitle: (request: {
    inputPath: string;
    streamIndex: number;
    format?: 'webvtt' | 'ass';
  }) => Promise<string>;
};

type CreateEmbeddedSubtitleServiceOptions = {
  media: EmbeddedLookup;
  transcoder: Extractor;
  canBurnImageSubtitles: () => Promise<boolean>;
  onProblem?: (path: string, reason: Said) => void;
};

/**
 * Names an embedded subtitle track for a menu, from what the container says about it — its
 * language, its own title, and whether it is forced or transcribes the sound.
 *
 * @param stream - The subtitle stream as the file declares it.
 * @param position - Which subtitle track this is, counting from one, for a stream naming nothing.
 * @returns The line to show in a menu.
 */
const describeSubtitle = (stream: EmbeddedStream, position: number): string => {
  const language = describeLanguage(stream.language);
  const title = stream.title?.trim() ?? '';
  const saysLanguage = language !== null && title.toLowerCase().includes(language.toLowerCase());

  const named =
    title === ''
      ? (language ?? say('common.numbered', { number: position }))
      : language === null || saysLanguage
        ? title
        : `${language} · ${title}`;

  return stream.isForced && !named.toLowerCase().includes('forced') ? `${named} · Forced` : named;
};

/**
 * Decides whether a track's own title says it transcribes more than the dialogue — the several
 * spellings of SDH and "hearing impaired" that files carry.
 *
 * @param title - The track's title as the container gives it.
 * @returns Whether it claims to transcribe the sound as well.
 */
const marksHearingImpaired = (title: string | null | undefined): boolean => {
  const lowered = (title ?? '').toLowerCase();

  return HEARING_IMPAIRED_MARKERS.some((marker) => lowered.includes(marker));
};

/**
 * Subtitles read out of the video container itself, converted to the one format a browser will
 * take. Extracting means reading the whole file, since a track's cues are spread through it, so the
 * media service keeps what it reads and reading begins the moment a player asks what tracks there
 * are — by the time a viewer turns subtitles on, the read has usually finished.
 *
 * @param options - The library to read files from, and the transcoder that does the extracting.
 * @returns The subtitle service.
 */
const createEmbeddedSubtitleService = ({
  media,
  transcoder,
  canBurnImageSubtitles,
  onProblem,
}: CreateEmbeddedSubtitleServiceOptions): SubtitleService => {
  const discover = async (mediaId: string) => {
    const found = await media.find(mediaId);

    if (found === null) {
      return null;
    }

    const streams = found.streams.filter((stream) => !UNREADABLE.has(stream.format));

    return { path: found.path, streams };
  };

  /**
   * Builds the identifier for one embedded stream, so listing the tracks and later fetching one agree
   * on what each is called.
   *
   * @param path - The file the stream is in.
   * @param index - The stream's index inside the container.
   * @returns The track identifier.
   */
  const idFor = (path: string, index: number): string => trackId(`${path}#${index.toString()}`);

  /**
   * Starts the media service reading a file's text tracks without waiting for it, so the read is
   * under way before anybody chooses one. The first track stands in for all of them, because the
   * media service takes every text track out of a file in the same pass.
   *
   * @param path - The file the tracks are in.
   * @param streams - The file's subtitle streams.
   */
  const startReading = (path: string, streams: EmbeddedStream[]): void => {
    const text = streams.find((stream) => !isImageSubtitle(stream.format));

    if (text === undefined) {
      return;
    }

    void transcoder.readSubtitle({ inputPath: path, streamIndex: text.index }).catch(() => null);
  };

  /**
   * A styled track's script, copied out of the container as the file carries it.
   *
   * @param mediaId - The title.
   * @param id - The track.
   * @returns The script, or nothing for a track with no styling or one that cannot be read.
   */
  const readScript = async (mediaId: string, id: string): Promise<string | null> => {
    const found = await discover(mediaId);
    const stream = found?.streams.find((candidate) => idFor(found.path, candidate.index) === id);

    if (
      found === null ||
      stream === undefined ||
      !STYLED_FORMATS.has(stream.format.toLowerCase())
    ) {
      return null;
    }

    return transcoder
      .readSubtitle({ inputPath: found.path, streamIndex: stream.index, format: 'ass' })
      .catch(() => null);
  };

  return {
    list: async (mediaId) => {
      const found = await discover(mediaId);

      if (found === null) {
        return null;
      }

      startReading(found.path, found.streams);

      const canBurn = found.streams.some((stream) => isImageSubtitle(stream.format))
        ? await canBurnImageSubtitles()
        : false;

      const tracks: SubtitleTrack[] = found.streams
        .filter((stream) => !isImageSubtitle(stream.format) || canBurn)
        .map((stream, position) => ({
          id: idFor(found.path, stream.index),
          language: readLanguage(stream.language),
          label: describeSubtitle(stream, position + 1),
          format: stream.format,
          isForced: stream.isForced,
          isHearingImpaired: marksHearingImpaired(stream.title),
          delivery: isImageSubtitle(stream.format) ? ('burnIn' as const) : ('text' as const),
          streamIndex: stream.index,
        }));

      return tracks;
    },

    read: async (mediaId, id) => {
      const found = await discover(mediaId);
      const stream = found?.streams.find((candidate) => idFor(found.path, candidate.index) === id);

      if (found === null || stream === undefined) {
        return null;
      }

      if (isImageSubtitle(stream.format)) {
        return null;
      }

      try {
        return await transcoder.readSubtitle({
          inputPath: found.path,
          streamIndex: stream.index,
        });
      } catch (error) {
        onProblem?.(
          found.path,
          error instanceof Error
            ? sayVerbatim(describeFailure(error))
            : saying('server.subtitles.sidecarSubtitleService.unreadable'),
        );

        return null;
      }
    },

    readScript,

    readCues: async (mediaId, id) => cuesOfScript(await readScript(mediaId, id)),
  };
};

export type { EmbeddedStream };

export { createEmbeddedSubtitleService, describeSubtitle, marksHearingImpaired };
