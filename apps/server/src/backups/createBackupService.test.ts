import { describe, expect, it, vi } from 'vitest';
import { createBackupService } from './createBackupService';

const aFolder = (start: string[]) => {
  const files = new Set(start);

  return {
    files,
    options: {
      folder: '/backups',
      kept: 2,
      tool: 'pg_dump',
      restoreCommand: 'restore',
      sizeOf: () => Promise.resolve(1024),
      remove: (path: string) => {
        files.delete(path.replace('/backups/', ''));

        return Promise.resolve();
      },
      readFolder: () => Promise.resolve([...files]),
    },
  };
};

describe('createBackupService', () => {
  it('lists the copies in the folder, newest first, and ignores anything else there', async () => {
    const { options } = aFolder([
      'valence-2026-09-01T00-00-00-000Z-by-hand.dump',
      'notes.txt',
      'valence-2026-10-01T00-00-00-000Z-before-0128_plays_and_audit.dump',
    ]);
    const backups = createBackupService({ ...options, take: () => Promise.resolve('taken') });

    const listed = await backups.list();

    expect(listed.backups.map((one) => one.kind)).toEqual(['beforeUpgrade', 'byHand']);
    expect(listed.backups[0]?.before).toBe('0128_plays_and_audit');
    expect(listed.backups[0]?.sizeBytes).toBe(1024);
  });

  it('takes a copy by hand under its own name', async () => {
    const { options, files } = aFolder([]);
    const take = vi.fn((name: string) => {
      files.add(name);

      return Promise.resolve<'taken'>('taken');
    });
    const backups = createBackupService({
      ...options,
      take,
      now: () => new Date('2026-10-17T03:04:05.678Z'),
    });

    const taken = await backups.take('byHand');

    expect(take).toHaveBeenCalledWith('valence-2026-10-17T03-04-05-678Z-by-hand.dump');
    expect(taken).toMatchObject({ kind: 'byHand', sizeBytes: 1024 });
  });

  it('prunes only the scheduled copies, to the number kept', async () => {
    const { options, files } = aFolder([
      'valence-2026-09-01T00-00-00-000Z-on-schedule.dump',
      'valence-2026-09-08T00-00-00-000Z-on-schedule.dump',
      'valence-2026-09-02T00-00-00-000Z-by-hand.dump',
    ]);
    const backups = createBackupService({
      ...options,
      take: (name) => {
        files.add(name);

        return Promise.resolve('taken');
      },
      now: () => new Date('2026-09-15T00:00:00.000Z'),
    });

    await backups.take('onSchedule');

    expect([...files].toSorted()).toEqual([
      'valence-2026-09-02T00-00-00-000Z-by-hand.dump',
      'valence-2026-09-08T00-00-00-000Z-on-schedule.dump',
      'valence-2026-09-15T00-00-00-000Z-on-schedule.dump',
    ]);
  });

  it('says when the dump tool is not installed', async () => {
    const { options } = aFolder([]);
    const backups = createBackupService({ ...options, take: () => Promise.resolve('missing') });

    expect(await backups.take('byHand')).toBe('missing');
    expect((await backups.list()).isToolInstalled).toBe(false);
  });

  it('removes only a copy that is in the folder', async () => {
    const { options, files } = aFolder(['valence-2026-09-02T00-00-00-000Z-by-hand.dump']);
    const backups = createBackupService({ ...options, take: () => Promise.resolve('taken') });

    expect(await backups.remove('../../etc/passwd')).toBe(false);
    expect(await backups.remove('valence-2026-09-02T00-00-00-000Z-by-hand.dump')).toBe(true);
    expect(files.size).toBe(0);
  });
});
