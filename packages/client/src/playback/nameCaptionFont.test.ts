import { describe, expect, it } from 'vitest';
import { CAPTION_FONTS } from '@ValenceClient/playback/CAPTION_FONTS';
import { nameCaptionFont } from './nameCaptionFont';

describe('nameCaptionFont', () => {
  it('names every font the settings offer, each differently', () => {
    const names = CAPTION_FONTS.map(nameCaptionFont);

    expect(new Set(names).size).toBe(CAPTION_FONTS.length);
    expect(nameCaptionFont('smallCapitals')).toBe('Small capitals');
  });
});
