import { describe, expect, it } from 'vitest';
import { TONE_MAPPINGS, ToneMappingSchema } from './ToneMapping';

describe('ToneMappingSchema', () => {
  it('reads every way the media service can tone map', () => {
    for (const mapping of TONE_MAPPINGS) {
      expect(ToneMappingSchema.parse(mapping)).toBe(mapping);
    }
  });

  it('knows tonemapx, which the media service prefers to zscale', () => {
    expect(TONE_MAPPINGS).toContain('tonemapx');
  });

  it('refuses a tone mapper it does not know', () => {
    expect(ToneMappingSchema.safeParse('hable').success).toBe(false);
  });
});
