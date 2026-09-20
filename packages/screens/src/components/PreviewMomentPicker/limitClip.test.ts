import { describe, expect, it } from 'vitest';
import { limitClip } from './limitClip';

describe('limitClip', () => {
  it('leaves a clip within the limit alone', () => {
    expect(limitClip(100, 200, 200, 300)).toEqual([100, 200]);
  });

  it('carries the end along when the start is pulled away past the limit', () => {
    expect(limitClip(0, 500, 500, 300)).toEqual([0, 300]);
  });

  it('carries the start along when the end is pulled away past the limit', () => {
    expect(limitClip(100, 700, 200, 300)).toEqual([400, 700]);
  });
});
