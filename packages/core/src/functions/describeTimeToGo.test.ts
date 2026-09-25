import { describe, expect, it } from 'vitest';
import { describeTimeToGo } from './describeTimeToGo';

describe('describeTimeToGo', () => {
  it('rounds to the units a person would say', () => {
    expect(describeTimeToGo(12 * 60)).toBe('about 12 min left');
    expect(describeTimeToGo(3900)).toBe('about 1 h 5 min left');
  });

  it('says under a minute rather than counting seconds', () => {
    expect(describeTimeToGo(20)).toBe('under a minute left');
  });
});
