import { describe, expect, it } from 'vitest';
import { SUBTITLE_CRITERIA } from '@ValenceContracts/schemas/SubtitleFinding';
import { SUBTITLE_CRITERION_LABELS } from './SUBTITLE_CRITERION_LABELS';

describe('SUBTITLE_CRITERION_LABELS', () => {
  it('names everything a subtitle is checked against a file on', () => {
    expect(Object.keys(SUBTITLE_CRITERION_LABELS).sort()).toEqual([...SUBTITLE_CRITERIA].sort());
    expect(SUBTITLE_CRITERION_LABELS.releaseGroup).toBe('Release group');
  });
});
