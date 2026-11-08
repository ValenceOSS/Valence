import { join } from 'node:path';
import { numberInFile } from './numberInFile';

const NO_LIMIT = 2 ** 60;

/**
 * Says which cgroup hierarchy describes the container this service runs in: version two wherever
 * its memory is counted, since the root of that hierarchy carries no count, and version one only
 * with a memory limit set, since outside a container its root describes the whole machine.
 *
 * @param root - Where the cgroup filesystem is mounted.
 * @returns The hierarchy, or nothing where neither describes a container.
 */
const containerHierarchyIn = async (root: string): Promise<'unified' | 'legacy' | null> => {
  if ((await numberInFile(join(root, 'memory.current'))) !== null) {
    return 'unified';
  }

  const used = await numberInFile(join(root, 'memory', 'memory.usage_in_bytes'));
  const limit = await numberInFile(join(root, 'memory', 'memory.limit_in_bytes'));

  return used !== null && limit !== null && limit < NO_LIMIT ? 'legacy' : null;
};

export { containerHierarchyIn };
