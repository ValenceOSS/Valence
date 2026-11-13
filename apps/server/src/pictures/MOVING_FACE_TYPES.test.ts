import { describe, expect, it } from 'vitest';
import { MOVING_FACE_TYPES } from './MOVING_FACE_TYPES';

describe('MOVING_FACE_TYPES', () => {
  it('names the type of each moving face by its extension', () => {
    expect(MOVING_FACE_TYPES['.mp4']).toBe('video/mp4');
    expect(MOVING_FACE_TYPES['.png']).toBeUndefined();
  });
});
