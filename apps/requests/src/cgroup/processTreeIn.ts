import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Finds a process and every process under it, however deep, from a `/proc` filesystem.
 *
 * @param proc - Where `/proc` is mounted.
 * @param pid - The process at the top.
 * @returns Their identifiers, or nothing where there is no `/proc` or the process is not in it.
 */
const processTreeIn = async (proc: string, pid: number): Promise<number[] | null> => {
  const names = await readdir(proc).catch(() => null);

  if (names === null) {
    return null;
  }

  const parents = new Map<number, number>();

  await Promise.all(
    names
      .filter((name) => /^\d+$/.test(name))
      .map(async (name) => {
        const stat = await readFile(join(proc, name, 'stat'), 'utf8').catch(() => null);
        const fields = stat?.slice(stat.lastIndexOf(')') + 2).split(' ');
        const parent = Number(fields?.[1]);

        if (Number.isInteger(parent)) {
          parents.set(Number(name), parent);
        }
      }),
  );

  if (!parents.has(pid)) {
    return null;
  }

  const tree = new Set([pid]);

  for (let grew = true; grew;) {
    grew = false;

    for (const [child, parent] of parents) {
      if (!tree.has(child) && tree.has(parent)) {
        tree.add(child);
        grew = true;
      }
    }
  }

  return [...tree];
};

export { processTreeIn };
