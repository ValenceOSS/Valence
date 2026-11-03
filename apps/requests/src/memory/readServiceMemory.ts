import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

type ReadServiceMemoryOptions = {
  root?: string;
  proc?: string;
  pid?: number;
  ownBytes?: () => number;
};

const NO_LIMIT = 2 ** 60;

/**
 * Reads one number from a cgroup file, or nothing where the file is missing or holds a word.
 *
 * @param path - The file.
 * @returns The number.
 */
const numberIn = async (path: string): Promise<number | null> => {
  const text = await readFile(path, 'utf8').catch(() => null);
  const value = text === null ? Number.NaN : Number(text.trim());

  return text === null || text.trim() === '' || !Number.isFinite(value) ? null : value;
};

/**
 * Reads one field of a `memory.stat`, or nothing where it is not there.
 *
 * @param path - The `memory.stat`.
 * @param field - The name at the start of the line.
 * @returns The number.
 */
const fieldIn = async (path: string, field: string): Promise<number | null> => {
  const text = await readFile(path, 'utf8').catch(() => null);
  const line = text?.split('\n').find((one) => one.startsWith(`${field} `));
  const value = line === undefined ? Number.NaN : Number(line.slice(field.length + 1));

  return Number.isFinite(value) ? value : null;
};

/**
 * Adds up what a process and everything it started are holding, from a `/proc` filesystem, or
 * nothing where there is none to read.
 *
 * @param proc - Where `/proc` is mounted.
 * @param pid - The process at the top.
 * @returns The bytes.
 */
const treeBytesIn = async (proc: string, pid: number): Promise<number | null> => {
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

  const sizes = await Promise.all(
    [...tree].map(async (one) => {
      const status = await readFile(join(proc, one.toString(), 'status'), 'utf8').catch(() => '');
      const kilobytes = /^VmRSS:\s+(\d+)\s*kB/m.exec(status)?.[1];

      return kilobytes === undefined ? 0 : Number(kilobytes) * 1024;
    }),
  );

  return sizes.reduce((total, bytes) => total + bytes, 0);
};

/**
 * Works out what this service is costing in memory, browser included: the whole container where
 * its cgroup says, less the file pages the kernel would drop the moment anything wanted the room;
 * where there is no container to read, this process and every process under it, the browser's
 * among them; and this process alone where not even that can be read.
 *
 * A version one hierarchy is believed only with a limit set, since outside a container its root
 * describes the whole machine.
 *
 * @param root - Where the cgroup filesystem is mounted.
 * @param proc - Where `/proc` is mounted.
 * @param pid - This process.
 * @param ownBytes - What this process alone is holding.
 * @returns The bytes.
 */
const readServiceMemory = async ({
  root = '/sys/fs/cgroup',
  proc = '/proc',
  pid = process.pid,
  ownBytes = () => process.memoryUsage.rss(),
}: ReadServiceMemoryOptions = {}): Promise<number> => {
  const unified = await numberIn(join(root, 'memory.current'));

  if (unified !== null) {
    const cache = (await fieldIn(join(root, 'memory.stat'), 'inactive_file')) ?? 0;

    return Math.max(0, unified - cache);
  }

  const legacy = join(root, 'memory');
  const used = await numberIn(join(legacy, 'memory.usage_in_bytes'));
  const limit = await numberIn(join(legacy, 'memory.limit_in_bytes'));

  if (used !== null && limit !== null && limit < NO_LIMIT) {
    const cache = (await fieldIn(join(legacy, 'memory.stat'), 'total_inactive_file')) ?? 0;

    return Math.max(0, used - cache);
  }

  return (await treeBytesIn(proc, pid)) ?? ownBytes();
};

export { readServiceMemory };
