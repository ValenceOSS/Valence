import { describe, expect, it } from 'vitest';
import { isExplicitIn } from './isExplicitIn';

describe('isExplicitIn', () => {
  it('reads the iTunes advisory an MP3 carries', () => {
    expect(
      isExplicitIn({ native: { 'ID3v2.3': [{ id: 'TXXX:ITUNESADVISORY', value: '1' }] } }),
    ).toBe(true);
  });

  it('reads the rating atom an MP4 carries', () => {
    expect(isExplicitIn({ native: { iTunes: [{ id: 'rtng', value: 1 }] } })).toBe(true);
  });

  it('reads the plain comment a FLAC may carry', () => {
    expect(isExplicitIn({ native: { vorbis: [{ id: 'EXPLICIT', value: 'true' }] } })).toBe(true);
  });

  it('takes a clean edit as clean', () => {
    expect(isExplicitIn({ native: { iTunes: [{ id: 'rtng', value: 2 }] } })).toBe(false);
  });

  it('calls a track that says nothing clean', () => {
    expect(isExplicitIn({ native: { vorbis: [{ id: 'TITLE', value: 'Caramel' }] } })).toBe(false);
  });
});
