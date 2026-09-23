import { describe, expect, it } from 'vitest';
import { howTheFileSounds } from './howTheFileSounds';

describe('howTheFileSounds', () => {
  it('calls a CD-quality file lossless', () => {
    expect(howTheFileSounds({ isLossless: true, sampleRate: 44_100 }, true)).toBe('Lossless');
  });

  it('calls a 24-bit file at 48 kHz lossless, as Apple Music does, rather than hi-res', () => {
    expect(howTheFileSounds({ isLossless: true, sampleRate: 48_000 }, true)).toBe('Lossless');
  });

  it('calls a file above 48 kHz hi-res', () => {
    expect(howTheFileSounds({ isLossless: true, sampleRate: 96_000 }, true)).toBe(
      'Hi-Res Lossless',
    );
  });

  it('says nothing of a lossy file', () => {
    expect(howTheFileSounds({ isLossless: false, sampleRate: 44_100 }, true)).toBe(null);
  });

  it('says nothing of a lossless file being sent smaller than it is', () => {
    expect(howTheFileSounds({ isLossless: true, sampleRate: 96_000 }, false)).toBe(null);
  });
});
