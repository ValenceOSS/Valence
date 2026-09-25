import { theCueAt } from './theCueAt';
import type { SubtitleCue, SubtitleSpan } from '@ValenceClient/playback/fetchSubtitleCues';

const aSpan = (text: string, colour: string | null = null): SubtitleSpan => ({
  text,
  colour,
  fontFamily: null,
  fontHeight: null,
  opacity: null,
  isBold: false,
  isItalic: false,
  isUnderlined: false,
  isStruckThrough: false,
});

const aCue = (from: number, to: number, text: string): SubtitleCue => ({
  from,
  to,
  spans: [aSpan(text)],
  alignment: 2,
  position: null,
  margins: { left: 0, right: 0, vertical: 0 },
  isSign: false,
});

const TRACK = [aCue(0, 2, 'one'), aCue(1, 4, 'over'), aCue(5, 7, 'later')];

describe('theCueAt', () => {
  it('finds the line showing at a moment', () => {
    expect(theCueAt(TRACK, 5.5).map((cue) => cue.spans[0]?.text)).toEqual(['later']);
  });

  it('keeps every line showing at once, since a sign can sit over speech', () => {
    expect(theCueAt(TRACK, 1.5).map((cue) => cue.spans[0]?.text)).toEqual(['one', 'over']);
  });

  it('shows a line from the moment it begins', () => {
    expect(theCueAt(TRACK, 5)).toHaveLength(1);
  });

  it('drops a line the moment it ends, rather than one frame late', () => {
    expect(theCueAt(TRACK, 7)).toHaveLength(0);
  });

  it('shows nothing in the gaps', () => {
    expect(theCueAt(TRACK, 4.5)).toEqual([]);
  });

  it('shows nothing before anything has been said', () => {
    expect(theCueAt(TRACK, -1)).toEqual([]);
  });

  it('shows nothing for a track with nothing in it', () => {
    expect(theCueAt([], 3)).toEqual([]);
  });
});
