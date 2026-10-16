import { say } from '@ValenceI18n/say';
import { describeSubtitleLabel } from './describeSubtitleLabel';
import { trackId } from './SubtitleService';
import type { SubtitleService, SubtitleTrack } from './SubtitleService';
import type { SubtitleSettings } from '@ValenceContracts/schemas/SubtitleSettings';

type GeneratedWords =
  | { state: 'ready'; content: string; language: string | null }
  | { state: 'working' }
  | { state: 'unavailable' };

type Writer = {
  generateSubtitle?: (request: {
    inputPath: string;
    audioStreamIndex: number | null;
    model: SubtitleSettings['whisperModel'];
    language: string | null;
    translate: boolean;
  }) => Promise<GeneratedWords>;
};

type GeneratedLookup = {
  find: (mediaId: string) => Promise<{ path: string; audioStreamIndex: number | null } | null>;
};

type CreateGeneratedSubtitleServiceOptions = {
  media: GeneratedLookup;
  transcoder: Writer;
  settings: () => Promise<SubtitleSettings>;
  others: (mediaId: string) => Promise<SubtitleTrack[] | null>;
};

/**
 * Subtitles Whisper wrote for a film or episode that has none of any kind — none in the file, none
 * beside it and none fetched — so somebody who cannot hear it, or is watching with the sound down,
 * can still follow it. Asking for the tracks is what starts the writing, and until the media
 * service has finished listening there is nothing to offer; once it has, the track is offered on
 * every client like any other, named as generated so nobody takes it for the film's own.
 *
 * Off until an administrator turns it on, and never for a title that has subtitles already: a
 * machine's hearing is worth having only where there is nothing better.
 *
 * @param options - The library to read files from, the media service that listens, the subtitle
 *   settings, and the title's other subtitles.
 * @returns The subtitle service.
 */
const createGeneratedSubtitleService = ({
  media,
  transcoder,
  settings,
  others,
}: CreateGeneratedSubtitleServiceOptions): SubtitleService => {
  /**
   * What Whisper wrote for a title, starting it where it has not, with the track it is offered as.
   *
   * @param mediaId - The title.
   * @returns The track and its words, or nothing where there is none to offer yet.
   */
  const written = async (
    mediaId: string,
  ): Promise<{ track: SubtitleTrack; content: string } | null> => {
    const saved = await settings();

    if (!saved.writesSubtitles || transcoder.generateSubtitle === undefined) {
      return null;
    }

    const already = (await others(mediaId)) ?? [];

    if (already.length > 0) {
      return null;
    }

    const found = await media.find(mediaId);

    if (found === null) {
      return null;
    }

    const heard = await transcoder
      .generateSubtitle({
        inputPath: found.path,
        audioStreamIndex: found.audioStreamIndex,
        model: saved.whisperModel,
        language: saved.whisperLanguage,
        translate: saved.translatesToEnglish,
      })
      .catch(() => null);

    if (heard?.state !== 'ready') {
      return null;
    }

    return {
      content: heard.content,
      track: {
        id: trackId(
          `${found.path}#generated#${saved.whisperModel}#${saved.whisperLanguage ?? 'auto'}#${String(saved.translatesToEnglish)}`,
        ),
        language: heard.language,
        label: say('server.subtitles.generated.languageGenerated', {
          language: describeSubtitleLabel(heard.language, false, false),
        }),
        format: 'generated',
        isForced: false,
        isHearingImpaired: false,
        delivery: 'text',
        streamIndex: null,
      },
    };
  };

  return {
    list: async (mediaId) => {
      const found = await written(mediaId);

      return found === null ? [] : [found.track];
    },

    read: async (mediaId, id) => {
      const found = await written(mediaId);

      return found !== null && found.track.id === id ? found.content : null;
    },

    readCues: () => Promise.resolve(null),

    readScript: () => Promise.resolve(null),
  };
};

export { createGeneratedSubtitleService };
