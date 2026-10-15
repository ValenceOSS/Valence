import { describe, expect, it } from 'vitest';
import { timelineMarks } from './timelineMarks';

const INTRO = {
  kind: 'intro' as const,
  startSeconds: 60,
  endSeconds: 120,
  source: 'fingerprint' as const,
};

describe('timelineMarks', () => {
  it('lays the stretches and chapter breaks along the bar as fractions of it', () => {
    expect(
      timelineMarks(
        [INTRO],
        [
          { title: 'Opening', startSeconds: 0, endSeconds: 300 },
          { title: null, startSeconds: 300, endSeconds: 600 },
        ],
        600,
      ),
    ).toEqual({ stretches: [{ from: 0.1, to: 0.2, kind: 'intro' }], notches: [0.5] });
  });

  it('marks no breaks for a file of one chapter', () => {
    expect(
      timelineMarks([], [{ title: null, startSeconds: 0, endSeconds: 600 }], 600).notches,
    ).toEqual([]);
  });

  it('keeps every mark on the bar, and drops one that runs past its end entirely', () => {
    expect(
      timelineMarks([{ ...INTRO, startSeconds: 500, endSeconds: 900 }], [], 600).stretches,
    ).toEqual([{ from: 500 / 600, to: 1, kind: 'intro' }]);
    expect(
      timelineMarks([{ ...INTRO, startSeconds: 700, endSeconds: 900 }], [], 600).stretches,
    ).toEqual([]);
  });

  it('marks nothing before it knows how long the item runs', () => {
    expect(timelineMarks([INTRO], [], 0)).toEqual({ stretches: [], notches: [] });
  });
});
