import { describe, expect, it, vi } from 'vitest';
import { probeSnapshotTool } from './probeSnapshotTool';

describe('probeSnapshotTool', () => {
  it('finds mariadb-dump where mysqldump is missing', async () => {
    const run = vi.fn((tool: string) =>
      Promise.resolve(tool === 'mariadb-dump' ? ('ran' as const) : ('missing' as const)),
    );

    expect(await probeSnapshotTool(run)).toBe('ran');
  });

  it('says missing when neither is installed', async () => {
    expect(await probeSnapshotTool(() => Promise.resolve('missing'))).toBe('missing');
  });
});
