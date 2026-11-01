import { describe, expect, it } from 'vitest';
import { homeRowKey } from './homeRowKey';

describe('homeRowKey', () => {
  it('keeps one person’s row apart from another’s, whatever the ids hold', () => {
    expect(homeRowKey('trending', 'p1')).not.toBe(homeRowKey('trending', 'p2'));
    expect(homeRowKey('a', 'b,c')).not.toBe(homeRowKey('a,b', 'c'));
  });
});
