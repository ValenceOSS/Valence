import { describe, expect, it } from 'vitest';
import { FrameQuerySchema } from './FrameQuery';

describe('FrameQuerySchema', () => {
  it('reads where a picture sits from an upload’s address', () => {
    expect(FrameQuerySchema.parse({ zoom: '2', x: '-0.5', y: '1' })).toEqual({
      zoom: 2,
      x: -0.5,
      y: 1,
    });
    expect(FrameQuerySchema.parse({})).toEqual({});
  });

  it('turns away a frame out of bounds', () => {
    expect(FrameQuerySchema.safeParse({ zoom: '9' }).success).toBe(false);
    expect(FrameQuerySchema.safeParse({ x: '2' }).success).toBe(false);
  });
});
