import { describe, expect, it } from 'vitest';
import { isAudioFile } from './isAudioFile';

describe('isAudioFile', () => {
  it('reads the formats music is kept in', () => {
    for (const name of ['a.mp3', 'a.flac', 'a.m4a', 'a.ogg', 'a.opus', 'a.wav', 'a.aiff']) {
      expect(isAudioFile(name)).toBe(true);
    }
  });

  it('reads an extension however it is cased', () => {
    expect(isAudioFile('/x/TRACK.FLAC')).toBe(true);
  });

  it('leaves out what sits beside the tracks', () => {
    for (const name of ['cover.jpg', 'INFO.nfo', 'lyrics.lrc', 'film.mkv']) {
      expect(isAudioFile(name)).toBe(false);
    }
  });
});
