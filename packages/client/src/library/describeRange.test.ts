import { describe, expect, it } from 'vitest';
import { describeRange } from './describeRange';

describe('describeRange', () => {
  it('names a high dynamic range as it is sold', () => {
    expect(describeRange('DolbyVision')).toBe('Dolby Vision');
    expect(describeRange('HDR10Plus')).toBe('HDR10+');
  });

  it('leaves standard range unsaid', () => {
    expect(describeRange('SDR')).toBeNull();
  });
});
