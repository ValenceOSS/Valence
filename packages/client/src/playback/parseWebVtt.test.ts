import { describe, expect, it } from 'vitest';
import { cueAt, parseWebVtt, secondsOf } from './parseWebVtt';

const A_FILE = `WEBVTT

1
00:00:01.000 --> 00:00:04.000
Hello there

2
00:00:05.500 --> 00:00:07.250
Two lines
of speech
`;

describe('secondsOf', () => {
  it('reads hours, minutes, seconds and thousandths', () => {
    expect(secondsOf('01:02:03.500')).toBeCloseTo(3723.5);
  });

  it('reads a stamp written without hours, which plenty are', () => {
    expect(secondsOf('02:03.250')).toBeCloseTo(123.25);
  });

  it('reads a comma where a file uses one', () => {
    expect(secondsOf('00:00:01,500')).toBeCloseTo(1.5);
  });

  it('reads nothing out of something that is not a stamp', () => {
    expect(secondsOf('WEBVTT')).toBeNull();
  });
});

describe('parseWebVtt', () => {
  it('reads when each line starts, when it ends and what it says', () => {
    expect(parseWebVtt(A_FILE)).toEqual([
      { from: 1, to: 4, text: 'Hello there' },
      { from: 5.5, to: 7.25, text: 'Two lines\nof speech' },
    ]);
  });

  it('keeps a line broken where the file broke it', () => {
    expect(parseWebVtt(A_FILE)[1]?.text).toContain('\n');
  });

  it('strips markup rather than rendering what a file asked for', () => {
    const read = parseWebVtt(
      'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n<i>Said</i><script>no</script>',
    );

    expect(read[0]?.text).toBe('Saidno');
  });

  it('ignores a block that carries no timing', () => {
    expect(
      parseWebVtt('WEBVTT\n\nNOTE something\n\n00:00:01.000 --> 00:00:02.000\nSaid'),
    ).toHaveLength(1);
  });

  it('ignores a line that ends before it starts', () => {
    expect(parseWebVtt('WEBVTT\n\n00:00:05.000 --> 00:00:02.000\nSaid')).toEqual([]);
  });

  it('ignores a line with nothing in it', () => {
    expect(parseWebVtt('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n')).toEqual([]);
  });

  it('reads a file whose lines end the way Windows ends them', () => {
    expect(parseWebVtt('WEBVTT\r\n\r\n00:00:01.000 --> 00:00:02.000\r\nSaid')).toEqual([
      { from: 1, to: 2, text: 'Said' },
    ]);
  });

  it('reads nothing out of nothing, rather than failing', () => {
    expect(parseWebVtt('')).toEqual([]);
  });

  it('keeps the words after a blank line inside a line, which a converted script writes', () => {
    expect(
      parseWebVtt('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nRomaji line\n\nEnglish line\n'),
    ).toEqual([{ from: 1, to: 2, text: 'Romaji line\nEnglish line' }]);
  });

  it('keeps a line that begins with a blank one', () => {
    expect(
      parseWebVtt(
        'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n\nRaised by one row\n\n00:00:03.000 --> 00:00:04.000\nNext',
      ),
    ).toEqual([
      { from: 1, to: 2, text: 'Raised by one row' },
      { from: 3, to: 4, text: 'Next' },
    ]);
  });

  it('does not take a cue’s number, or a note, for more of the line before it', () => {
    expect(
      parseWebVtt(
        'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nSaid\n\n2\n\nNOTE an aside\n\n00:00:03.000 --> 00:00:04.000\nNext',
      ).map((cue) => cue.text),
    ).toEqual(['Said', 'Next']);
  });
});

describe('cueAt', () => {
  const cues = parseWebVtt(A_FILE);

  it('finds what is being said at a moment', () => {
    expect(cueAt(cues, 2)?.text).toBe('Hello there');
  });

  it('says nothing where nobody is speaking', () => {
    expect(cueAt(cues, 4.5)).toBeNull();
  });

  it('lets a line go the moment it ends', () => {
    expect(cueAt(cues, 4)).toBeNull();
  });

  it('shows a line from the moment it starts', () => {
    expect(cueAt(cues, 5.5)?.text).toContain('Two lines');
  });
});
