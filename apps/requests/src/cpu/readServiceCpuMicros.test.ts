import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { aFolderOf } from '@ValenceRequests/testing/aFolderOf';
import { readServiceCpuMicros } from './readServiceCpuMicros';

const NO_PROC = join(tmpdir(), 'no-such-proc-for-this-test');

const aProcess = (pid: number, parent: number, ticks: [number, number, number, number]) => ({
  [`${pid.toString()}/stat`]: `${pid.toString()} (node) S ${parent.toString()} 1 1 0 -1 4194304 0 0 0 0 ${ticks.join(' ')} 20 0 9`,
});

describe('readServiceCpuMicros', () => {
  it('reads the whole container, browser and all, where it is version two', async () => {
    const root = await aFolderOf({
      'memory.current': '1000\n',
      'cpu.stat': 'usage_usec 4500000\nuser_usec 4000000\n',
    });

    await expect(readServiceCpuMicros({ root, proc: NO_PROC, ownMicros: () => 1 })).resolves.toBe(
      4_500_000,
    );
  });

  it('reads the container in microseconds where it is version one with a limit', async () => {
    const root = await aFolderOf({
      'memory/memory.usage_in_bytes': '900\n',
      'memory/memory.limit_in_bytes': '2000\n',
      'cpuacct/cpuacct.usage': '7000000500\n',
    });

    await expect(readServiceCpuMicros({ root, proc: NO_PROC, ownMicros: () => 1 })).resolves.toBe(
      7_000_000,
    );
  });

  it('adds up this process and everything under it, with the children each has seen finish, where there is no container', async () => {
    const root = await aFolderOf({ 'cpu.stat': 'usage_usec 99999999\n' });
    const proc = await aFolderOf({
      ...aProcess(100, 1, [10, 5, 2, 1]),
      ...aProcess(101, 100, [100, 20, 0, 0]),
      ...aProcess(200, 1, [9000, 9000, 0, 0]),
    });

    await expect(readServiceCpuMicros({ root, proc, pid: 100, ownMicros: () => 1 })).resolves.toBe(
      138 * 10_000,
    );
  });

  it('falls back to this process alone where nothing else can be read', async () => {
    await expect(
      readServiceCpuMicros({ root: await aFolderOf({}), proc: NO_PROC, ownMicros: () => 700 }),
    ).resolves.toBe(700);
  });
});
