import { describe, expect, it } from 'vitest';
import { writeICalendar } from './writeICalendar';

const STAMP = new Date('2026-10-02T21:05:09.123Z');

const EVENT = {
  uid: 'tv:300:s2e5@valence',
  date: '2026-10-08',
  summary: 'A Show · S2 E5 · Fifth',
  description: 'Not out yet',
  url: 'https://valence.example/calendar?on=2026-10-08',
};

describe('writeICalendar', () => {
  it('writes a calendar of all-day events, every line ending CRLF', () => {
    const written = writeICalendar([EVENT], { name: 'Valence calendar', stamp: STAMP });

    expect(written.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true);
    expect(written.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(written.replaceAll('\r\n', '')).not.toMatch(/\n/);
    expect(written).toContain('X-WR-CALNAME:Valence calendar\r\n');
    expect(written).toContain('DTSTAMP:20261002T210509Z\r\n');
    expect(written).toContain('DTSTART;VALUE=DATE:20261008\r\n');
    expect(written).toContain('DTEND;VALUE=DATE:20261009\r\n');
    expect(written).toContain('SUMMARY:A Show · S2 E5 · Fifth\r\n');
    expect(written).toContain('TRANSP:TRANSPARENT\r\n');
  });

  it('ends an event on the last day of a month on the first of the next', () => {
    expect(
      writeICalendar([{ ...EVENT, date: '2026-12-31' }], { name: 'Valence', stamp: STAMP }),
    ).toContain('DTEND;VALUE=DATE:20270101\r\n');
  });

  it('escapes what a text value may not hold as it is', () => {
    const written = writeICalendar(
      [{ ...EVENT, summary: 'One, two; three\\four', description: 'Line one\nline two' }],
      { name: 'Valence', stamp: STAMP },
    );

    expect(written).toContain('SUMMARY:One\\, two\\; three\\\\four\r\n');
    expect(written).toContain('DESCRIPTION:Line one\\nline two\r\n');
  });

  it('leaves out what an event does not have', () => {
    const written = writeICalendar([{ ...EVENT, description: null, url: null }], {
      name: 'Valence',
      stamp: STAMP,
    });

    expect(written).not.toContain('DESCRIPTION');
    expect(written).not.toContain('URL');
  });

  it('folds a long line at 75 octets without splitting a character', () => {
    const written = writeICalendar([{ ...EVENT, summary: 'é'.repeat(60) }], {
      name: 'Valence',
      stamp: STAMP,
    });
    const lines = written.split('\r\n');
    const summary = lines.findIndex((line) => line.startsWith('SUMMARY:'));

    expect(lines[summary + 1]?.startsWith(' ')).toBe(true);
    expect(lines.every((line) => Buffer.byteLength(line, 'utf8') <= 75)).toBe(true);
    expect(`${lines[summary] ?? ''}${(lines[summary + 1] ?? '').slice(1)}`).toBe(
      `SUMMARY:${'é'.repeat(60)}`,
    );
  });

  it('writes an empty calendar where nothing comes out', () => {
    expect(writeICalendar([], { name: 'Valence', stamp: STAMP })).not.toContain('BEGIN:VEVENT');
  });
});
