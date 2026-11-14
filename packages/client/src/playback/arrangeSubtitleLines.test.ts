import { describe, expect, it } from 'vitest';
import { arrangeSubtitleLines } from './arrangeSubtitleLines';
import type { SubtitleCue } from './fetchSubtitleCues';

const aCue = (text: string, change: Partial<SubtitleCue> = {}): SubtitleCue => ({
  from: 1,
  to: 3,
  spans: [
    {
      text,
      fontFamily: null,
      fontHeight: null,
      colour: null,
      opacity: null,
      isBold: false,
      isItalic: false,
      isUnderlined: false,
      isStruckThrough: false,
    },
  ],
  alignment: 2,
  position: null,
  margins: { left: 0, right: 0, vertical: 0 },
  isSign: false,
  ...change,
});

const textOf = (cues: SubtitleCue[]) => cues.map((cue) => cue.spans[0]?.text);

describe('arrangeSubtitleLines', () => {
  it('stacks lines along the foot in the order the script wrote them', () => {
    const { rows } = arrangeSubtitleLines([aCue('First speaker'), aCue('Second speaker')]);

    expect(textOf(rows.bottom)).toEqual(['First speaker', 'Second speaker']);
  });

  it('puts a line aligned to the top or the middle in that row, not at the foot', () => {
    const { rows } = arrangeSubtitleLines([
      aCue('Up top', { alignment: 8 }),
      aCue('Top left', { alignment: 7 }),
      aCue('Halfway', { alignment: 5 }),
      aCue('Bottom right', { alignment: 3 }),
    ]);

    expect(textOf(rows.top)).toEqual(['Up top', 'Top left']);
    expect(textOf(rows.middle)).toEqual(['Halfway']);
    expect(textOf(rows.bottom)).toEqual(['Bottom right']);
  });

  it('keeps a line the script put at a point apart from every row', () => {
    const arranged = arrangeSubtitleLines([
      aCue('A sign', { position: { x: 0.5, y: 0.2 }, isSign: true }),
      aCue('Spoken'),
    ]);

    expect(textOf(arranged.placed)).toEqual(['A sign']);
    expect(textOf(arranged.rows.bottom)).toEqual(['Spoken']);
  });

  it('draws a line written several times over at the same moment once', () => {
    const sign = { position: { x: 0.5, y: 0.2 }, isSign: true };
    const arranged = arrangeSubtitleLines([
      aCue('CLOSED', sign),
      aCue('CLOSED', sign),
      aCue('Spoken'),
      aCue('Spoken'),
    ]);

    expect(textOf(arranged.placed)).toEqual(['CLOSED']);
    expect(textOf(arranged.rows.bottom)).toEqual(['Spoken']);
  });

  it('keeps the last of the copies, which is the one drawn on top', () => {
    const sign = { position: { x: 0.5, y: 0.2 }, isSign: true };
    const coloured = (colour: string): SubtitleCue => {
      const cue = aCue('CLOSED', sign);

      return { ...cue, spans: cue.spans.map((span) => ({ ...span, colour })) };
    };

    expect(
      arrangeSubtitleLines([coloured('#3399ff'), coloured('#ffffff')]).placed[0]?.spans[0]?.colour,
    ).toBe('#ffffff');
  });

  it('keeps the same words said at two different moments or places', () => {
    const arranged = arrangeSubtitleLines([
      aCue('Again'),
      aCue('Again', { from: 2 }),
      aCue('Here', { position: { x: 0.1, y: 0.1 } }),
      aCue('Here', { position: { x: 0.9, y: 0.1 } }),
    ]);

    expect(textOf(arranged.rows.bottom)).toEqual(['Again', 'Again']);
    expect(textOf(arranged.placed)).toEqual(['Here', 'Here']);
  });

  it('leaves out a line with nothing to read in it', () => {
    expect(arrangeSubtitleLines([aCue('  ')]).rows.bottom).toEqual([]);
  });
});
