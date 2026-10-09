import { describeLanguage } from '@ValenceCore/functions/describeTrack';
import { say } from '@ValenceI18n/say';

/**
 * Names a subtitle track the way it should read in a menu: the language in its own words, then what
 * makes it different from the other track in the same language — forced, or transcribing the sound
 * as well as the dialogue.
 *
 * @param language - The language the filename claimed.
 * @param isForced - Whether it claimed the track is forced.
 * @param isHearingImpaired - Whether it claimed the track transcribes the sound as well.
 * @returns The line to show in a menu.
 */
const describeSubtitleLabel = (
  language: string | null,
  isForced: boolean,
  isHearingImpaired: boolean,
): string => {
  const base = describeLanguage(language) ?? say('server.subtitles.findSidecarSubtitles.unknown');
  const notes = [isForced ? 'forced' : '', isHearingImpaired ? 'SDH' : ''].filter(
    (note) => note !== '',
  );

  return notes.length === 0 ? base : `${base} (${notes.join(', ')})`;
};

export { describeSubtitleLabel };
