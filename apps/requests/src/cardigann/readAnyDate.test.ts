import { describe, expect, it } from 'vitest';
import { readAnyDate } from './readAnyDate';

const NOW = Date.parse('2026-09-19T12:00:00.000Z');

describe('readAnyDate', () => {
  it.each([
    ['1505788002', '2017-09-19T02:26:42.000Z'],
    ['1505788002000', '2017-09-19T02:26:42.000Z'],
    ['now', '2026-09-19T12:00:00.000Z'],
    ['3 hours ago', '2026-09-19T09:00:00.000Z'],
    ['Today', '2026-09-19T00:00:00.000Z'],
    ['Today 14:22', '2026-09-19T14:22:00.000Z'],
    ['Yesterday at 2:22 pm', '2026-09-18T14:22:00.000Z'],
    ['Tomorrow, 08:00', '2026-09-20T08:00:00.000Z'],
    ['Wednesday at 15:30', '2026-09-16T15:30:00.000Z'],
    ['Saturday at 09:15', '2026-09-19T09:15:00.000Z'],
    ['01-31', '2026-01-31T00:00:00.000Z'],
    ['09-14 02:31', '2026-09-14T02:31:00.000Z'],
    ['1 Jan 10:30', '2026-01-01T10:30:00.000Z'],
    ['03/05/2024', '2024-03-05T00:00:00.000Z'],
    ['2024.03.05 14:30', '2024-03-05T14:30:00.000Z'],
    ['2024-03-05T14:30:00+02:00', '2024-03-05T12:30:00.000Z'],
    ['Tue, 05 Mar 2024 14:30:00 GMT', '2024-03-05T14:30:00.000Z'],
    ['Mar 5, 2024', '2024-03-05T00:00:00.000Z'],
    ['5 March 2024 10:00', '2024-03-05T10:00:00.000Z'],
    ['03/05/24 11:15:30', '2024-03-05T11:15:30.000Z'],
  ])('reads %s', (text, iso) => {
    expect(readAnyDate(text, NOW)?.toISOString()).toBe(iso);
  });

  it('reads a numeric date day first where told to', () => {
    expect(readAnyDate('03/05/2024', NOW, true)?.toISOString()).toBe('2024-05-03T00:00:00.000Z');
  });

  it('reads nothing it cannot make sense of', () => {
    expect(readAnyDate('', NOW)).toBeNull();
    expect(readAnyDate('whenever', NOW)).toBeNull();
    expect(readAnyDate('13/40/2024', NOW)).toBeNull();
    expect(readAnyDate('Today at noonish', NOW)).toBeNull();
    expect(readAnyDate('Monday at never', NOW)).toBeNull();
    expect(readAnyDate('12', NOW)?.getTime()).toBe(12_000);
  });
});
