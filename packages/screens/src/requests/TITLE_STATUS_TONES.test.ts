import { describe, expect, it } from 'vitest';
import { TITLE_STATUS_TONES } from './TITLE_STATUS_TONES';

describe('TITLE_STATUS_TONES', () => {
  it('colours a failed title as danger everywhere it is drawn', () => {
    expect(TITLE_STATUS_TONES.failed).toEqual({
      badge: 'danger',
      meter: 'danger',
      swatch: 'bg-danger',
    });
  });

  it('draws what is missing as the gap left in what is held', () => {
    expect(TITLE_STATUS_TONES.missing.meter).toBe('gap');
  });
});
