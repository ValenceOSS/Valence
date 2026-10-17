import { describe, expect, it } from 'vitest';
import { isSnapshotName } from '@ValenceServer/db/isSnapshotName';
import { nameBackup } from './nameBackup';

const AT = new Date('2026-10-17T03:04:05.678Z');

describe('nameBackup', () => {
  it('names one taken by hand', () => {
    expect(nameBackup(AT, 'byHand')).toBe('valence-2026-10-17T03-04-05-678Z-by-hand.dump');
  });

  it('names one taken on a schedule, as a snapshot the folder recognises', () => {
    const name = nameBackup(AT, 'onSchedule');

    expect(name).toBe('valence-2026-10-17T03-04-05-678Z-on-schedule.dump');
    expect(isSnapshotName(name)).toBe(true);
  });
});
