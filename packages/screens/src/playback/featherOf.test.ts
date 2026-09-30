import { describe, expect, it } from 'vitest';
import { featherOf } from './featherOf';

describe('featherOf', () => {
  it('fades a picture out towards both ends of the way it runs', () => {
    expect(featherOf('right', 0)).toBe(
      'linear-gradient(to right, transparent 0%, black calc(0% + 3rem), black calc(100% - 3rem), transparent 100%)',
    );
  });

  it('starts the fade past whatever is cropped away', () => {
    const mask = featherOf('bottom', 10);

    expect(mask).toContain('to bottom');
    expect(mask).toContain('transparent 10%');
    expect(mask).toContain('transparent 90%');
  });
});
