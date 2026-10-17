import { describe, expect, it } from 'vitest';
import { detailsOfSnapshot } from './detailsOfSnapshot';

describe('detailsOfSnapshot', () => {
  it('reads one taken before an upgrade', () => {
    expect(detailsOfSnapshot('valence-2026-09-21T16-30-05-123Z-before-0078_more.dump')).toEqual({
      kind: 'beforeUpgrade',
      takenAt: new Date('2026-09-21T16:30:05.123Z'),
      before: '0078_more',
    });
  });

  it('reads one taken by hand', () => {
    expect(detailsOfSnapshot('valence-2026-09-21T16-30-05-123Z-by-hand.dump')?.kind).toBe('byHand');
  });

  it('reads one taken on the schedule', () => {
    expect(detailsOfSnapshot('valence-2026-09-21T16-30-05-123Z-on-schedule.dump')?.kind).toBe(
      'onSchedule',
    );
  });

  it.each(['notes.txt', 'valence-latest.dump', 'valence-2026-09-21T16-30-05-123Z-elsewhere.dump'])(
    'ignores %s',
    (name) => {
      expect(detailsOfSnapshot(name)).toBeNull();
    },
  );
});
