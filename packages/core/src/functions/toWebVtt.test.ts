import { describe, expect, it } from 'vitest';
import { toWebVtt, fromSubRip, fromAdvancedSubStation, formatTimestamp } from './toWebVtt';

const subRip = ['1', '00:00:01,000 --> 00:00:03,500', 'Line one', '', '2'].join('\n');

const advancedSubStation = [
  '[Events]',
  'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  'Dialogue: 0,0:00:01.00,0:00:03.50,Default,,0,0,0,,Line one',
].join('\n');

describe('formatTimestamp', () => {
  it('writes the shape WebVTT demands', () => {
    expect(formatTimestamp(3725.5)).toBe('01:02:05.500');
  });

  it('never writes a negative time', () => {
    expect(formatTimestamp(-4)).toBe('00:00:00.000');
  });
});

describe('fromSubRip', () => {
  it('declares itself as WebVTT', () => {
    expect(fromSubRip(subRip).startsWith('WEBVTT\n')).toBe(true);
  });

  it('turns the comma in a timestamp into the full stop WebVTT wants', () => {
    expect(fromSubRip(subRip)).toContain('00:00:01.000 --> 00:00:03.500');
  });

  it('keeps the text of every cue', () => {
    expect(fromSubRip(subRip)).toContain('Line one');
  });

  it('pads an hour written with a single digit', () => {
    expect(fromSubRip('1\n0:00:01,000 --> 0:00:02,000\nLine\n')).toContain('00:00:01.000');
  });

  it('survives a file saved with Windows line endings and a byte order mark', () => {
    const windows = `﻿1\r\n00:00:01,000 --> 00:00:02,000\r\nLine\r\n`;

    expect(fromSubRip(windows)).toContain('00:00:01.000 --> 00:00:02.000');
    expect(fromSubRip(windows).startsWith('WEBVTT')).toBe(true);
  });
});

describe('fromAdvancedSubStation', () => {
  it('keeps the dialogue and its timing', () => {
    const converted = fromAdvancedSubStation(advancedSubStation);

    expect(converted).toContain('00:00:01.000 --> 00:00:03.500');
    expect(converted).toContain('Line one');
  });

  it('drops the styling codes, which WebVTT cannot express', () => {
    const styled = advancedSubStation.replace('Line one', '{\\pos(400,570)\\c&HFFFFFF&}Line one');

    expect(fromAdvancedSubStation(styled)).toContain('Line one');
    expect(fromAdvancedSubStation(styled)).not.toContain('\\pos');
  });

  it('reads the format line rather than assuming the column order', () => {
    const reordered = [
      '[Events]',
      'Format: Start, End, Text',
      'Dialogue: 0:00:05.00,0:00:06.00,Later line',
    ].join('\n');

    expect(fromAdvancedSubStation(reordered)).toContain('00:00:05.000 --> 00:00:06.000');
    expect(fromAdvancedSubStation(reordered)).toContain('Later line');
  });

  it('keeps dialogue containing commas whole', () => {
    const commas = advancedSubStation.replace('Line one', 'Wait, stop, listen');

    expect(fromAdvancedSubStation(commas)).toContain('Wait, stop, listen');
  });

  it('turns a hard line break into a real one', () => {
    const broken = advancedSubStation.replace('Line one', 'First\\NSecond');

    expect(fromAdvancedSubStation(broken)).toContain('First\nSecond');
  });

  it('ignores everything that is not dialogue', () => {
    const withHeader = ['[Script Info]', 'Title: Something', advancedSubStation].join('\n');

    expect(fromAdvancedSubStation(withHeader)).not.toContain('Script Info');
  });

  it('produces a valid, empty track when a script has no dialogue', () => {
    expect(fromAdvancedSubStation('[Script Info]\nTitle: Nothing')).toBe('WEBVTT\n\n');
  });

  it('drops a line whose timing cannot be read rather than emitting a broken cue', () => {
    const unreadable = advancedSubStation.replace('0:00:01.00', 'whenever');

    expect(fromAdvancedSubStation(unreadable)).toBe('WEBVTT\n\n');
  });

  it('drops a line that says nothing, which is a timing with no words in it', () => {
    const wordless = advancedSubStation.replace(',Line one', ',');

    expect(fromAdvancedSubStation(wordless)).toBe('WEBVTT\n\n');
  });

  it('leaves out a vector drawing rather than writing its coordinates as words', () => {
    const drawn = advancedSubStation.replace(
      'Line one',
      '{\\p1}m 0 0 l 100 0 100 100 0 100{\\p0}Line one',
    );

    expect(fromAdvancedSubStation(drawn)).not.toContain('m 0 0');
    expect(fromAdvancedSubStation(drawn)).toContain('Line one');
  });

  it('keeps a line after a blank one inside the same cue, since a blank line ends a cue', () => {
    const spaced = advancedSubStation.replace('Line one', 'First paragraph\\N\\NSecond paragraph');

    expect(fromAdvancedSubStation(spaced)).toContain('First paragraph\nSecond paragraph');
  });

  it('writes the cues in the order they start, as WebVTT asks', () => {
    const shuffled = [
      advancedSubStation,
      'Dialogue: 0,0:00:00.50,0:00:00.90,Default,,Earlier line',
    ].join('\n');
    const converted = fromAdvancedSubStation(shuffled);

    expect(converted.indexOf('Earlier line')).toBeLessThan(converted.indexOf('Line one'));
  });

  it('keeps its own idea of a column the Format line does not name', () => {
    const partial = advancedSubStation.replace(
      'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
      'Format: Layer, Start, End, Style',
    );

    expect(fromAdvancedSubStation(partial)).toContain('Line one');
  });
});

describe('toWebVtt', () => {
  it('passes a WebVTT file through untouched', () => {
    const source = 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nLine\n';

    expect(toWebVtt(source, 'vtt')).toBe(source);
  });

  it('adds the header to a file that somehow lacks one', () => {
    expect(toWebVtt('00:00:01.000 --> 00:00:02.000\nLine', 'vtt').startsWith('WEBVTT')).toBe(true);
  });

  it('converts SubRip', () => {
    expect(toWebVtt(subRip, 'srt')).toContain('00:00:01.000 --> 00:00:03.500');
  });

  it('converts Advanced SubStation', () => {
    expect(toWebVtt(advancedSubStation, 'ass')).toContain('Line one');
  });

  it('converts SubStation Alpha the same way', () => {
    expect(toWebVtt(advancedSubStation, 'ssa')).toContain('Line one');
  });
});
