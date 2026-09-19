import { describe, expect, it } from 'vitest';
import { parseDateFormat } from './parseDateFormat';

describe('parseDateFormat', () => {
  it.each([
    ['2024-03-05 14:30:00 +03:00', 'yyyy-MM-dd HH:mm:ss zzz', '2024-03-05T11:30:00.000Z'],
    ['2024-03-0514:30:00 +00:00', 'yyyy-MM-ddHH:mm:ss zzz', '2024-03-05T14:30:00.000Z'],
    ['03/05/2024 14:30:00 -05:00', 'MM/dd/yyyy HH:mm:ss zzz', '2024-03-05T19:30:00.000Z'],
    [
      'Tue, 05 Mar 2024 14:30:00 +01:00',
      'ddd, dd MMM yyyy HH:mm:ss zzz',
      '2024-03-05T13:30:00.000Z',
    ],
    ['05-03-2024 14:30', 'dd-MM-yyyy HH:mm', '2024-03-05T14:30:00.000Z'],
    ['Mar 5 2024 02:30 PM', 'MMM d yyyy hh:mm tt', '2024-03-05T14:30:00.000Z'],
    ['Mar 5 2024 12:10 AM', 'MMM d yyyy hh:mm tt', '2024-03-05T00:10:00.000Z'],
    ['5 March 2024 14:30:00 +02:00', 'd MMMM yyyy HH:mm:ss zzz', '2024-03-05T12:30:00.000Z'],
    ['5 Mar 24 14:30:00 +00:00', 'd MMM yy HH:mm:ss zzz', '2024-03-05T14:30:00.000Z'],
    ['05.03.2024 14:30:00.25', "dd'.'MM'.'yyyy HH:mm:ss.ff", '2024-03-05T14:30:00.250Z'],
    ['2024-03-05 +05', 'yyyy-MM-dd zz', '2024-03-04T19:00:00.000Z'],
    ['2024-03-05', '2006-01-02', '2024-03-05T00:00:00.000Z'],
    ['Mar 5, 2024 3:04 PM', 'Jan 2, 2006 3:04 PM', '2024-03-05T15:04:00.000Z'],
    ['1999-12-31T23:59:59Z', "yyyy-MM-dd'T'HH:mm:ssK", '1999-12-31T23:59:59.000Z'],
    ['12/31/99', 'MM/dd/yy', '1999-12-31T00:00:00.000Z'],
  ])('reads %s as %s', (text, layout, iso) => {
    expect(parseDateFormat(text, layout)?.toISOString()).toBe(iso);
  });

  it('assumes this year where the layout has none', () => {
    expect(parseDateFormat('05 Mar', 'dd MMM')?.getUTCFullYear()).toBe(new Date().getUTCFullYear());
  });

  it('reads nothing that is not in the layout', () => {
    expect(parseDateFormat('yesterday', 'yyyy-MM-dd')).toBeNull();
    expect(parseDateFormat('2024-13-05', 'yyyy-MM-dd')).toBeNull();
    expect(parseDateFormat('Foo 5 2024', 'MMM d yyyy')).toBeNull();
  });

  it('keeps an escaped letter as itself', () => {
    expect(parseDateFormat('2024h03', 'yyyy\\hMM')?.getUTCMonth()).toBe(2);
  });
});
