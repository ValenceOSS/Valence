import { describe, expect, it } from 'vitest';
import { SUBTITLE_REASONS } from '@ValenceContracts/schemas/SubtitleFinding';
import { SUBTITLE_REASON_LABELS } from './SUBTITLE_REASON_LABELS';

describe('SUBTITLE_REASON_LABELS', () => {
  it('names every reason a subtitle can fit a file for', () => {
    expect(Object.keys(SUBTITLE_REASON_LABELS).sort()).toEqual([...SUBTITLE_REASONS].sort());
    expect(SUBTITLE_REASON_LABELS.madeForThisFile).toBe('Made for this file');
  });
});
