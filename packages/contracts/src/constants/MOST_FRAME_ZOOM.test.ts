import { describe, expect, it } from 'vitest';
import { PhotoFrameSchema } from '@ValenceContracts/schemas/ViewerProfile';
import { MOST_FRAME_ZOOM } from './MOST_FRAME_ZOOM';

describe('MOST_FRAME_ZOOM', () => {
  it('is as near as a stored frame may be drawn', () => {
    expect(PhotoFrameSchema.safeParse({ zoom: MOST_FRAME_ZOOM, x: 0, y: 0 }).success).toBe(true);
    expect(PhotoFrameSchema.safeParse({ zoom: MOST_FRAME_ZOOM + 0.1, x: 0, y: 0 }).success).toBe(
      false,
    );
  });
});
