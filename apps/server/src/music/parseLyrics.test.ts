import { describe, expect, it } from 'vitest';
import { parseLyrics } from './parseLyrics';

describe('parseLyrics', () => {
  it('reads each stamped line at its time', () => {
    expect(parseLyrics('[00:12.50]First line\n[01:02.03]Second line')).toEqual({
      isSynced: true,
      lines: [
        { atMs: 12_500, text: 'First line' },
        { atMs: 62_030, text: 'Second line' },
      ],
    });
  });

  it('reads thousandths where three digits were written', () => {
    expect(parseLyrics('[00:01.250]x').lines[0]?.atMs).toBe(1250);
  });

  it('places a chorus written once at every time it is sung', () => {
    const { lines } = parseLyrics('[00:10.00][00:40.00]Chorus\n[00:20.00]Verse');

    expect(lines.map((line) => [line.atMs, line.text])).toEqual([
      [10_000, 'Chorus'],
      [20_000, 'Verse'],
      [40_000, 'Chorus'],
    ]);
  });

  it('leaves out the headers that describe the file', () => {
    const { lines } = parseLyrics('[ar:Sleep Token]\n[ti:Caramel]\n[00:01.00]Words');

    expect(lines).toEqual([{ atMs: 1000, text: 'Words' }]);
  });

  it('moves the song by the offset it states', () => {
    expect(parseLyrics('[offset:+500]\n[00:02.00]Late').lines[0]?.atMs).toBe(1500);
  });

  it('keeps a stamped empty line, which is a pause between verses', () => {
    expect(parseLyrics('[00:01.00]A\n[00:05.00]\n[00:09.00]B').lines[1]).toEqual({
      atMs: 5000,
      text: '',
    });
  });

  it('reads lyrics with no stamps as plain lines that do not follow along', () => {
    expect(parseLyrics('\nOne\nTwo\n\n\nThree\n')).toEqual({
      isSynced: false,
      lines: [
        { atMs: null, text: 'One' },
        { atMs: null, text: 'Two' },
        { atMs: null, text: '' },
        { atMs: null, text: 'Three' },
      ],
    });
  });

  it('reads Windows line endings', () => {
    expect(parseLyrics('[00:01.00]A\r\n[00:02.00]B').lines).toHaveLength(2);
  });

  it('has no lines where there were none', () => {
    expect(parseLyrics('')).toEqual({ isSynced: false, lines: [] });
  });
});
