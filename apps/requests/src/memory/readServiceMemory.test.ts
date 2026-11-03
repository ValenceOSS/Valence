import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readServiceMemory } from './readServiceMemory';

const roots: string[] = [];

const NO_PROC = join(tmpdir(), 'no-such-proc-for-this-test');

const aProcess = (pid: number, parent: number, kilobytes: number, name = 'node') => ({
  [`${pid.toString()}/stat`]: `${pid.toString()} (${name}) S ${parent.toString()} 1 1 0 -1`,
  [`${pid.toString()}/status`]: `Name:\t${name}\nVmRSS:\t  ${kilobytes.toString()} kB\nThreads:\t9\n`,
});

const aRoot = async (files: Record<string, string>): Promise<string> => {
  const root = await mkdtemp(join(tmpdir(), 'cgroup-'));

  roots.push(root);

  for (const [name, contents] of Object.entries(files)) {
    await mkdir(join(root, name, '..'), { recursive: true });
    await writeFile(join(root, name), contents);
  }

  return root;
};

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('readServiceMemory', () => {
  it('counts the whole container, browser and all, less the cache the kernel would drop', async () => {
    const root = await aRoot({
      'memory.current': '3000000000\n',
      'memory.stat': 'anon 2600000000\ninactive_file 400000000\nactive_file 10\n',
    });

    expect(await readServiceMemory({ root, ownBytes: () => 1, proc: NO_PROC })).toBe(2_600_000_000);
  });

  it('takes the container whole where it says nothing about cache', async () => {
    const root = await aRoot({ 'memory.current': '5000\n' });

    expect(await readServiceMemory({ root, ownBytes: () => 1, proc: NO_PROC })).toBe(5000);
  });

  it('reads a version one hierarchy where a limit says it is a container', async () => {
    const root = await aRoot({
      'memory/memory.usage_in_bytes': '9000\n',
      'memory/memory.limit_in_bytes': '1000000\n',
      'memory/memory.stat': 'cache 5\ntotal_inactive_file 1000\n',
    });

    expect(await readServiceMemory({ root, ownBytes: () => 1, proc: NO_PROC })).toBe(8000);
  });

  it('does not take a version one root with no limit for a container, since it is the machine', async () => {
    const root = await aRoot({
      'memory/memory.usage_in_bytes': '60000000000\n',
      'memory/memory.limit_in_bytes': '9223372036854771712\n',
    });

    expect(await readServiceMemory({ root, ownBytes: () => 700, proc: NO_PROC })).toBe(700);
  });

  it('falls back to this process alone where there is no cgroup at all', async () => {
    const root = await aRoot({});

    expect(await readServiceMemory({ root, ownBytes: () => 700, proc: NO_PROC })).toBe(700);
  });

  it('adds up this process and everything under it, browser and all, where there is no cgroup', async () => {
    const root = await aRoot({});
    const proc = await aRoot({
      ...aProcess(100, 1, 400_000),
      ...aProcess(101, 100, 2_000_000, 'camoufox-bin'),
      ...aProcess(102, 101, 150_000, 'Isolated Web Co'),
      ...aProcess(200, 1, 9_000_000, 'somebody else'),
      'self/stat': 'not a process',
    });

    expect(await readServiceMemory({ root, proc, pid: 100, ownBytes: () => 1 })).toBe(
      2_550_000 * 1024,
    );
  });

  it('falls back to this process alone where it cannot find itself among the processes', async () => {
    const root = await aRoot({});
    const proc = await aRoot(aProcess(200, 1, 9_000_000));

    expect(await readServiceMemory({ root, proc, pid: 100, ownBytes: () => 700 })).toBe(700);
  });

  it('never reports less than nothing when the cache outweighs the reading', async () => {
    const root = await aRoot({
      'memory.current': '100\n',
      'memory.stat': 'inactive_file 400\n',
    });

    expect(await readServiceMemory({ root, ownBytes: () => 1, proc: NO_PROC })).toBe(0);
  });
});
