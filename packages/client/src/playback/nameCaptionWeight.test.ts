import { describe, expect, it } from 'vitest';
import { CAPTION_WEIGHTS } from '@ValenceClient/playback/CAPTION_WEIGHTS';
import { nameCaptionWeight } from './nameCaptionWeight';

describe('nameCaptionWeight', () => {
  it('names every weight the settings offer, lightest first', () => {
    expect(CAPTION_WEIGHTS.map(nameCaptionWeight)).toEqual([
      'Light',
      'Regular',
      'Medium',
      'Bold',
      'Heavy',
    ]);
  });
});
