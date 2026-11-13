import { describe, expect, it } from 'vitest';
import { describeScanPhase } from './describeScanPhase';

describe('describeScanPhase', () => {
  it('names a stage it knows in words', () => {
    expect(describeScanPhase('probing')).not.toBe('probing');
  });

  it('falls back to the server’s own name for a stage it does not know', () => {
    expect(describeScanPhase('polishing')).toBe('polishing');
  });
});
