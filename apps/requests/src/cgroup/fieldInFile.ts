import { readFile } from 'node:fs/promises';

/**
 * Reads one field of a cgroup file of named numbers, such as `memory.stat` or `cpu.stat`, or nothing
 * where it is not there.
 *
 * @param path - The file.
 * @param field - The name at the start of the line.
 * @returns The number.
 */
const fieldInFile = async (path: string, field: string): Promise<number | null> => {
  const text = await readFile(path, 'utf8').catch(() => null);
  const line = text?.split('\n').find((one) => one.startsWith(`${field} `));
  const value = line === undefined ? Number.NaN : Number(line.slice(field.length + 1));

  return Number.isFinite(value) ? value : null;
};

export { fieldInFile };
