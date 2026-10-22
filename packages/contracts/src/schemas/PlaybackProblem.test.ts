import { describe, expect, it } from 'vitest';
import {
  PLAYBACK_PROBLEM_NAMES,
  PLAYBACK_PROBLEMS,
  PlaybackProblemReportSchema,
} from './PlaybackProblem';

describe('PLAYBACK_PROBLEMS', () => {
  it('gives every problem a code of its own', () => {
    const codes = PLAYBACK_PROBLEM_NAMES.map((name) => PLAYBACK_PROBLEMS[name].code);

    expect(new Set(codes).size).toBe(codes.length);
  });

  it('numbers each problem in the hundred of its group', () => {
    const hundreds = { file: 1, format: 2, connection: 3, account: 4, player: 5, download: 6 };

    for (const name of PLAYBACK_PROBLEM_NAMES) {
      const { code, group } = PLAYBACK_PROBLEMS[name];

      expect(Math.floor(code / 100)).toBe(hundreds[group]);
    }
  });

  it('counts only a lost connection or stream as something that can pass', () => {
    expect(PLAYBACK_PROBLEM_NAMES.filter((name) => PLAYBACK_PROBLEMS[name].isPassing)).toEqual([
      'unreachable',
      'streamLost',
    ]);
  });
});

describe('PlaybackProblemReportSchema', () => {
  it('reads a report of a problem from a player', () => {
    expect(
      PlaybackProblemReportSchema.parse({
        problem: 'damaged',
        mediaId: 'media-1',
        sessionId: 'abc',
        positionSeconds: 12.4,
        details: 'This file is damaged',
      }),
    ).toMatchObject({ problem: 'damaged', positionSeconds: 12.4 });
  });

  it('refuses details too long to be what a player copied', () => {
    expect(
      PlaybackProblemReportSchema.safeParse({
        problem: 'damaged',
        mediaId: 'media-1',
        sessionId: null,
        positionSeconds: null,
        details: 'x'.repeat(4001),
      }).success,
    ).toBe(false);
  });
});
