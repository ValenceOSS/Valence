import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSnapshotBeforeMigrating } from '@ValenceServer/db/createSnapshotBeforeMigrating';

const mocks = vi.hoisted(() => ({
  takeSnapshot: vi.fn(),
  listSnapshots: vi.fn(),
  rm: vi.fn(),
}));

vi.mock('@ValenceServer/db/takeSnapshot', () => ({ takeSnapshot: mocks.takeSnapshot }));
vi.mock('@ValenceServer/db/listSnapshots', () => ({ listSnapshots: mocks.listSnapshots }));
vi.mock('node:fs/promises', () => ({ rm: mocks.rm }));

const build = (overrides: { isEnabled?: boolean; applied?: number[] } = {}) => {
  const say = vi.fn();
  const snapshot = createSnapshotBeforeMigrating({
    databaseUrl: 'postgres://db/valence',
    folder: '/backups',
    keep: 2,
    isEnabled: overrides.isEnabled ?? true,
    readAppliedAt: () => Promise.resolve(overrides.applied ?? [1]),
    say,
    now: () => new Date('2026-09-21T16:30:05.123Z'),
  });

  return { snapshot, say };
};

describe('createSnapshotBeforeMigrating', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.takeSnapshot.mockResolvedValue('taken');
    mocks.listSnapshots.mockResolvedValue(['c', 'b', 'a']);
    mocks.rm.mockResolvedValue(undefined);
  });

  it('takes a snapshot named for the last migration and prunes the oldest', async () => {
    const { snapshot } = build();

    await snapshot(['0001_a', '0002_b']);

    expect(mocks.takeSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'valence-2026-09-21T16-30-05-123Z-before-0002_b.dump',
      }),
    );
    expect(mocks.rm).toHaveBeenCalledWith('/backups/a');
  });

  it('leaves a database that has never migrated alone', async () => {
    const { snapshot } = build({ applied: [] });

    await snapshot(['0001_a']);

    expect(mocks.takeSnapshot).not.toHaveBeenCalled();
  });

  it('does nothing when switched off', async () => {
    const { snapshot } = build({ isEnabled: false });

    await snapshot(['0001_a']);

    expect(mocks.takeSnapshot).not.toHaveBeenCalled();
  });

  it('warns and carries on where pg_dump is not installed', async () => {
    mocks.takeSnapshot.mockResolvedValue('missing');

    const { snapshot, say } = build();

    await snapshot(['0001_a']);

    expect(say).toHaveBeenCalledWith('error', expect.stringContaining('pg_dump is not installed'));
    expect(mocks.rm).not.toHaveBeenCalled();
  });

  it('does not migrate when the snapshot fails', async () => {
    mocks.takeSnapshot.mockRejectedValue(new Error('connection refused'));

    const { snapshot } = build();

    await expect(snapshot(['0001_a'])).rejects.toThrow('connection refused');
  });
});
