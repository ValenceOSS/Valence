import { describe, expect, it } from 'vitest';
import { isKeptCopy } from './isKeptCopy';

describe('isKeptCopy', () => {
  it('knows a copy kept beside its film by the mark before its extension', () => {
    expect(isKeptCopy('/movies/Arrival (2016)/Arrival (2016) - 1080p H264.valence.mp4')).toBe(true);
    expect(isKeptCopy('C:\\movies\\Arrival\\Arrival - 720p HEVC 2000kbps.VALENCE.MKV')).toBe(true);
  });

  it('leaves a film alone whatever else its name says', () => {
    expect(isKeptCopy('/movies/Valence (2020)/Valence (2020).mkv')).toBe(false);
    expect(isKeptCopy('/movies/The.valence.Story.2020.mkv')).toBe(false);
  });

  it('leaves a copy still being written to the rule for files that are not video', () => {
    expect(isKeptCopy('/movies/Arrival/Arrival - 1080p H264.valence.mp4.valencepart')).toBe(false);
  });
});
