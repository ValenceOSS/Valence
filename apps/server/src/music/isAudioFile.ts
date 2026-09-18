import { extname } from 'node:path';

const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.flac',
  '.m4a',
  '.aac',
  '.alac',
  '.ogg',
  '.oga',
  '.opus',
  '.wav',
  '.aiff',
  '.aif',
  '.wma',
  '.ape',
  '.wv',
]);

/**
 * Whether a file is a track a music library reads, by what it is named.
 *
 * @param path - The file.
 * @returns Whether it is audio.
 */
const isAudioFile = (path: string): boolean => AUDIO_EXTENSIONS.has(extname(path).toLowerCase());

export { isAudioFile };
