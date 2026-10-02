import { describe, expect, it } from 'vitest';
import { SUBTITLE_STEP_SECONDS } from '@ValenceClient/playback/SUBTITLE_STEP_SECONDS';
import { SUBTITLE_NUDGES } from './SUBTITLE_NUDGES';

describe('SUBTITLE_NUDGES', () => {
  it('runs as far early as late, in steps, through being on time', () => {
    expect(SUBTITLE_NUDGES).toHaveLength(13);
    expect(SUBTITLE_NUDGES[0]).toBe(-6 * SUBTITLE_STEP_SECONDS);
    expect(SUBTITLE_NUDGES[6]).toBe(0);
    expect(SUBTITLE_NUDGES.at(-1)).toBe(6 * SUBTITLE_STEP_SECONDS);
  });
});
