import { describe, expect, it } from 'vitest';
import { isSnapshotName } from '@ValenceServer/db/isSnapshotName';
import { nameSnapshot } from '@ValenceServer/db/nameSnapshot';

describe('nameSnapshot', () => {
  it('leads with the stamp and names the migration it was taken ahead of', () => {
    expect(nameSnapshot(new Date('2026-09-21T16:30:05.123Z'), '0078_more')).toBe(
      'valence-2026-09-21T16-30-05-123Z-before-0078_more.dump',
    );
  });

  it('writes names that sort by age', () => {
    const older = nameSnapshot(new Date('2026-01-01T00:00:00.000Z'), '0001_a');
    const newer = nameSnapshot(new Date('2026-02-01T00:00:00.000Z'), '0001_a');

    expect([newer, older].toSorted()).toEqual([older, newer]);
  });

  it('writes names isSnapshotName recognises', () => {
    expect(isSnapshotName(nameSnapshot(new Date(), '0078_more'))).toBe(true);
  });
});
