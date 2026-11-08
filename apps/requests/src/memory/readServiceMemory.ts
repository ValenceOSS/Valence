import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { containerHierarchyIn } from '@ValenceRequests/cgroup/containerHierarchyIn';
import { fieldInFile } from '@ValenceRequests/cgroup/fieldInFile';
import { numberInFile } from '@ValenceRequests/cgroup/numberInFile';
import { processTreeIn } from '@ValenceRequests/cgroup/processTreeIn';

type ReadServiceMemoryOptions = {
  root?: string;
  proc?: string;
  pid?: number;
  ownBytes?: () => number;
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
  const tree = await processTreeIn(proc, pid);

  if (tree === null) {
    return null;
  }

  const sizes = await Promise.all(
    tree.map(async (one) => {
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
  const hierarchy = await containerHierarchyIn(root);

  if (hierarchy === 'unified') {
    const used = (await numberInFile(join(root, 'memory.current'))) ?? 0;
    const cache = (await fieldInFile(join(root, 'memory.stat'), 'inactive_file')) ?? 0;

    return Math.max(0, used - cache);
  }

  if (hierarchy === 'legacy') {
    const legacy = join(root, 'memory');
    const used = (await numberInFile(join(legacy, 'memory.usage_in_bytes'))) ?? 0;
    const cache = (await fieldInFile(join(legacy, 'memory.stat'), 'total_inactive_file')) ?? 0;

    return Math.max(0, used - cache);
  }

  return (await treeBytesIn(proc, pid)) ?? ownBytes();
};

export { readServiceMemory };
