import { describe, expect, it } from 'vitest';
import { describeSubtitleLabel } from './describeSubtitleLabel';

describe('describeSubtitleLabel', () => {
  it('names a language the way a viewer reads it', () => {
    expect(describeSubtitleLabel('de', false, false)).toBe('Deutsch');
  });

  it('says so when a track is forced', () => {
    expect(describeSubtitleLabel('en', true, false)).toBe('English (forced)');
  });

  it('says so when a track is for the hard of hearing', () => {
    expect(describeSubtitleLabel('en', false, true)).toBe('English (SDH)');
  });

  it('falls back to the code it was given', () => {
    expect(describeSubtitleLabel('tlh', false, false)).toBe('TLH');
  });

  it('admits when it does not know the language', () => {
    expect(describeSubtitleLabel(null, false, false)).toBe('Unknown');
  });
});
