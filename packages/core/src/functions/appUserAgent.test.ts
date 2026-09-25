import { describe, expect, it } from 'vitest';
import { appUserAgent } from './appUserAgent';

describe('appUserAgent', () => {
  it('names the device the app is on', () => {
    expect(appUserAgent('Living Room')).toBe('Valence (Living Room)');
  });

  it('keeps only what a header can carry, so a curly apostrophe cannot stop the request', () => {
    expect(appUserAgent('Dan’s iPhone')).toBe("Valence (Dan's iPhone)");
    expect(appUserAgent('📺 (Den)')).toBe('Valence (Den)');
  });

  it('still says it is Valence where nothing of the name is left', () => {
    expect(appUserAgent('📺')).toBe('Valence (Valence app)');
  });
});
