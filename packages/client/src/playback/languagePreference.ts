import { platformInUse } from '@ValenceClient/platform/installPlatform';

const SUBTITLES_KEY = 'valence.subtitleLanguage';

const AUDIO_KEY = 'valence.audioLanguage';

/**
 * The subtitle language this device last chose, carried to the next film or episode and kept across
 * the app being closed: a language, off where they turned them off, or nothing where they never
 * chose.
 *
 * @returns The language, the word for off, or nothing.
 */
const readSubtitleLanguage = (): string | null => platformInUse().store.read(SUBTITLES_KEY);

/**
 * Remembers the subtitle language chosen on this device, or that they were turned off.
 *
 * @param language - The language, or the word for off.
 */
const saveSubtitleLanguage = (language: string): void => {
  platformInUse().store.write(SUBTITLES_KEY, language);
};

/**
 * The soundtrack language this device last chose, carried to the next film or episode and kept
 * across the app being closed.
 *
 * @returns The language, or nothing where they never chose.
 */
const readAudioLanguage = (): string | null => platformInUse().store.read(AUDIO_KEY);

/**
 * Remembers the soundtrack language chosen on this device.
 *
 * @param language - The language.
 */
const saveAudioLanguage = (language: string): void => {
  platformInUse().store.write(AUDIO_KEY, language);
};

export { readAudioLanguage, readSubtitleLanguage, saveAudioLanguage, saveSubtitleLanguage };
