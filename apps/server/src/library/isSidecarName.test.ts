import { describe, expect, it } from 'vitest';
import { isSidecarName } from './isSidecarName';

describe('isSidecarName', () => {
  it('knows subtitles, NFOs and pictures, and nothing else', () => {
    expect(isSidecarName('Film.en.srt')).toBe(true);
    expect(isSidecarName('Film.nfo')).toBe(true);
    expect(isSidecarName('poster.JPG')).toBe(true);
    expect(isSidecarName('Film.mkv')).toBe(false);
    expect(isSidecarName('notes.txt')).toBe(false);
  });
});
