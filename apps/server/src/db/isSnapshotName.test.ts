import { describe, expect, it } from 'vitest';
import { isSnapshotName } from '@ValenceServer/db/isSnapshotName';

describe('isSnapshotName', () => {
  it('accepts a snapshot', () => {
    expect(isSnapshotName('valence-2026-09-21T16-30-05-123Z-before-0078_more.dump')).toBe(true);
  });

  it.each([
    'valence-2026-09-21T16-30-05-123Z-by-hand.dump',
    'valence-2026-09-21T16-30-05-123Z-on-schedule.dump',
  ])('accepts a backup taken outside an upgrade, %s', (name) => {
    expect(isSnapshotName(name)).toBe(true);
  });

  it.each(['notes.txt', 'valence-latest.dump', 'valence-2026-09-21T16-30-05-123Z-before-.dump'])(
    'ignores %s',
    (name) => {
      expect(isSnapshotName(name)).toBe(false);
    },
  );
});
