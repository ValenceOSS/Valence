import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { containerHierarchyIn } from '@ValenceRequests/cgroup/containerHierarchyIn';
import { fieldInFile } from '@ValenceRequests/cgroup/fieldInFile';
import { numberInFile } from '@ValenceRequests/cgroup/numberInFile';
import { processTreeIn } from '@ValenceRequests/cgroup/processTreeIn';

type ReadServiceCpuMicrosOptions = {
  root?: string;
  proc?: string;
  pid?: number;
  ownMicros?: () => number;
};

const MICROS_A_TICK = 10_000;

/**
 * Adds up the processor time a process and everything under it have used, from a `/proc`
 * filesystem: each one's own time and that of the children it has already seen finish.
 *
 * @param proc - Where `/proc` is mounted.
 * @param pid - The process at the top.
 * @returns The microseconds, or nothing where there is no `/proc` to read.
 */
const treeMicrosIn = async (proc: string, pid: number): Promise<number | null> => {
  const tree = await processTreeIn(proc, pid);

  if (tree === null) {
    return null;
  }

  const ticks = await Promise.all(
    tree.map(async (one) => {
      const stat = await readFile(join(proc, one.toString(), 'stat'), 'utf8').catch(() => '');
      const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');

      return [11, 12, 13, 14]
        .map((index) => Number(fields[index]))
        .reduce((total, count) => total + (Number.isFinite(count) ? count : 0), 0);
    }),
  );

  return ticks.reduce((total, count) => total + count, 0) * MICROS_A_TICK;
};

/**
 * Reads how much processor time this service has used, browser included: the whole container where
 * its cgroup says, this process and every process under it where there is no container, and this
 * process alone where not even that can be read.
 *
 * @param root - Where the cgroup filesystem is mounted.
 * @param proc - Where `/proc` is mounted.
 * @param pid - This process.
 * @param ownMicros - What this process alone has used.
 * @returns The microseconds.
 */
const readServiceCpuMicros = async ({
  root = '/sys/fs/cgroup',
  proc = '/proc',
  pid = process.pid,
  ownMicros = () => {
    const used = process.cpuUsage();

    return used.user + used.system;
  },
}: ReadServiceCpuMicrosOptions = {}): Promise<number> => {
  const hierarchy = await containerHierarchyIn(root);

  if (hierarchy === 'unified') {
    const used = await fieldInFile(join(root, 'cpu.stat'), 'usage_usec');

    if (used !== null) {
      return used;
    }
  }

  if (hierarchy === 'legacy') {
    const nanoseconds = await numberInFile(join(root, 'cpuacct', 'cpuacct.usage'));

    if (nanoseconds !== null) {
      return Math.floor(nanoseconds / 1000);
    }
  }

  return (await treeMicrosIn(proc, pid)) ?? ownMicros();
};

export { readServiceCpuMicros };
