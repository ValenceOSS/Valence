import { extname } from 'node:path';
import { AUDIO_FILE_EXTENSIONS } from '@ValenceContracts/constants/AUDIO_FILE_EXTENSIONS';

/**
 * Whether a file is a track a music library reads, by what it is named.
 *
 * @param path - The file.
 * @returns Whether it is audio.
 */
const isAudioFile = (path: string): boolean =>
  AUDIO_FILE_EXTENSIONS.has(extname(path).slice(1).toLowerCase());

export { isAudioFile };
