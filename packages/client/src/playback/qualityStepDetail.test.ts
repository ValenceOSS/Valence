import { describe, expect, it } from 'vitest';
import { qualityStepDetail } from './qualityStepDetail';

describe('qualityStepDetail', () => {
  it('says what a step would cost', () => {
    expect(qualityStepDetail({ cost: '722 kbps', isNoSmaller: false })).toBe('722 kbps');
  });

  it('says a step would save nothing, after what it would cost', () => {
    expect(qualityStepDetail({ cost: '1.4 Mbps', isNoSmaller: true })).toBe(
      '1.4 Mbps · no smaller than the original',
    );
  });

  it('says a step would save nothing where its cost is not known', () => {
    expect(qualityStepDetail({ cost: undefined, isNoSmaller: true })).toBe(
      'no smaller than the original',
    );
  });

  it('says nothing where there is nothing to say', () => {
    expect(qualityStepDetail({ cost: undefined, isNoSmaller: false })).toBeUndefined();
  });
});
