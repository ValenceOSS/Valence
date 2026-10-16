import { describe, expect, it } from 'vitest';
import { audioFacetsOf } from './audioFacetsOf';

describe('audioFacetsOf', () => {
  it('gathers every language, codec and channel count held, Atmos first and most channels first', () => {
    expect(
      audioFacetsOf([
        { language: 'jpn', codec: 'truehd', channels: 8, isAtmos: true },
        { language: 'eng', codec: 'aac', channels: 2, isAtmos: false },
        { language: 'eng', codec: 'eac3', channels: 6, isAtmos: false },
      ]),
    ).toEqual({
      audioLanguages: ['eng', 'jpn'],
      audioCodecs: ['atmos', 'aac', 'eac3', 'truehd'],
      audioChannels: [8, 6, 2],
    });
  });

  it('leaves out a tag that names no language, and fields a track did not say', () => {
    expect(
      audioFacetsOf([
        { language: 'und', codec: null, channels: null, isAtmos: false },
        { language: null, codec: 'flac', channels: 2, isAtmos: false },
      ]),
    ).toEqual({ audioLanguages: [], audioCodecs: ['flac'], audioChannels: [2] });
  });
});
