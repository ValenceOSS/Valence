import { describe, expect, it } from 'vitest';
import { askAgainWhileMatching } from './askAgainWhileMatching';

describe('askAgainWhileMatching', () => {
  it('asks again until the server says it is done', () => {
    expect(askAgainWhileMatching(undefined)).toBe(1500);
    expect(askAgainWhileMatching({ isMatching: true, albums: [] })).toBe(1500);
    expect(askAgainWhileMatching({ isMatching: false, albums: [] })).toBe(false);
  });
});
