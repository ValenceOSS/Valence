import { describe, expect, it } from 'vitest';
import { pickOneFaceEach } from './pickOneFaceEach';

const face = (id: string, madeAt: string) => ({ id, createdAt: new Date(madeAt) });

describe('pickOneFaceEach', () => {
  it('draws an account with the oldest profile it holds', () => {
    const rows = [
      { userId: 'dan', profile: face('older', '2026-01-01T00:00:00.000Z') },
      { userId: 'dan', profile: face('newer', '2026-06-01T00:00:00.000Z') },
    ];

    expect(pickOneFaceEach(rows).map((row) => row.profile.id)).toEqual(['older']);
  });

  it('draws it with the same profile however the rows arrive', () => {
    const older = { userId: 'dan', profile: face('older', '2026-01-01T00:00:00.000Z') };
    const newer = { userId: 'dan', profile: face('newer', '2026-06-01T00:00:00.000Z') };

    expect(pickOneFaceEach([newer, older])).toEqual(pickOneFaceEach([older, newer]));
  });

  it('keeps one row for every account', () => {
    const rows = [
      { userId: 'dan', profile: face('one', '2026-01-01T00:00:00.000Z') },
      { userId: 'sam', profile: face('two', '2026-02-01T00:00:00.000Z') },
      { userId: 'dan', profile: face('three', '2026-03-01T00:00:00.000Z') },
    ];

    expect(pickOneFaceEach(rows).map((row) => row.userId)).toEqual(['dan', 'sam']);
  });

  it('keeps an account that holds no profile at all', () => {
    const rows = [{ userId: 'dan', profile: null }];

    expect(pickOneFaceEach(rows)).toEqual(rows);
  });

  it('prefers a profile to no profile, whichever came first', () => {
    const held = face('held', '2026-01-01T00:00:00.000Z');

    expect(
      pickOneFaceEach([
        { userId: 'dan', profile: null },
        { userId: 'dan', profile: held },
      ]),
    ).toEqual([{ userId: 'dan', profile: held }]);

    expect(
      pickOneFaceEach([
        { userId: 'dan', profile: held },
        { userId: 'dan', profile: null },
      ]),
    ).toEqual([{ userId: 'dan', profile: held }]);
  });

  it('settles two profiles made in the same instant the same way every time', () => {
    const same = '2026-01-01T00:00:00.000Z';
    const rows = [
      { userId: 'dan', profile: face('b', same) },
      { userId: 'dan', profile: face('a', same) },
    ];

    expect(pickOneFaceEach(rows).map((row) => row.profile.id)).toEqual(['a']);
    expect(pickOneFaceEach([...rows].reverse()).map((row) => row.profile.id)).toEqual(['a']);
  });
});
