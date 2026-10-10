import { describe, expect, it } from 'vitest';
import { groupByDay } from './groupByDay';
import type { Notification } from '@ValenceContracts/schemas/Notification';

const NOW = new Date(2026, 9, 10, 15, 0).getTime();

const arrived = (id: string, at: Date): Notification => ({
  id,
  event: 'media.added',
  title: { code: 'common.media', message: 'Media', values: {} },
  body: { code: 'common.media', message: 'Media', values: {} },
  link: null,
  createdAt: at.toISOString(),
  readAt: null,
});

describe('groupByDay', () => {
  it('sorts notifications under today, yesterday and earlier by the calendar', () => {
    const groups = groupByDay(
      [
        arrived('a', new Date(2026, 9, 10, 0, 5)),
        arrived('b', new Date(2026, 9, 9, 23, 55)),
        arrived('c', new Date(2026, 9, 1, 12, 0)),
      ],
      NOW,
    );

    expect(groups.map((group) => [group.day, group.notifications.map((one) => one.id)])).toEqual([
      ['today', ['a']],
      ['yesterday', ['b']],
      ['earlier', ['c']],
    ]);
  });

  it('leaves out a day nothing arrived on', () => {
    expect(
      groupByDay([arrived('a', new Date(2026, 9, 10, 9, 0))], NOW).map((one) => one.day),
    ).toEqual(['today']);
    expect(groupByDay([], NOW)).toEqual([]);
  });
});
