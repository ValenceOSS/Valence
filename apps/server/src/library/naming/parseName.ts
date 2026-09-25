import { cleanDateTime } from './cleanDateTime';
import { cleanString } from './cleanString';

/**
 * Reads the name and year a catalogue should be asked for out of a file or folder name: the year
 * split off first, then the release noise cut from what is left.
 *
 * @param name - A file name without its extension, or a folder's name.
 * @returns The name to search for, and the year where the name gave one.
 */
const parseName = (name: string): { name: string; year: number | null } => {
  const dated = cleanDateTime(name);

  return { name: cleanString(dated.name) ?? dated.name, year: dated.year };
};

export { parseName };
