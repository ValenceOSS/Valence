import { describe, expect, it } from 'vitest';
import { describeProblemDetails } from './describeProblemDetails';

describe('describeProblemDetails', () => {
  it('copies everything an admin needs, a line each', () => {
    expect(
      describeProblemDetails({
        problem: 'damaged',
        cause: 'PIPELINE_ERROR_DECODE',
        title: 'Arrival',
        positionSeconds: 12.4,
        how: 'converted on the server',
        sessionId: 'abc',
        build: { version: '1.7.0', commit: null, runsOn: 'Desktop on macOS' },
      }).split('\n'),
    ).toEqual([
      'Error 101: This file is damaged',
      'What happened: PIPELINE_ERROR_DECODE',
      'Playing: Arrival at 0:12',
      'How: converted on the server',
      'Session: abc',
      'Valence 1.7.0 · Desktop on macOS',
      'More: https://docs.getvalence.app/use/playback-errors#error-101',
    ]);
  });

  it('leaves out what is not known rather than writing it blank', () => {
    expect(
      describeProblemDetails({
        problem: 'unreachable',
        cause: null,
        title: 'Arrival',
        positionSeconds: null,
        how: null,
        sessionId: null,
        build: null,
      }).split('\n'),
    ).toEqual([
      'Error 301: Couldn’t reach the server',
      'More: https://docs.getvalence.app/use/playback-errors#error-301',
    ]);
  });
});
