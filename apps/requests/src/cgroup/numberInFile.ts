import { readFile } from 'node:fs/promises';

/**
 * Reads the one number a cgroup file holds, or nothing where the file is missing or holds a word.
 *
 * @param path - The file.
 * @returns The number.
 */
const numberInFile = async (path: string): Promise<number | null> => {
  const text = await readFile(path, 'utf8').catch(() => null);
  const value = text === null ? Number.NaN : Number(text.trim());

  return text === null || text.trim() === '' || !Number.isFinite(value) ? null : value;
};

export { numberInFile };
