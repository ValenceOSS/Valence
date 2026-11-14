import { describe, expect, it } from 'vitest';
import { jellyfinMediaSourceOf } from './jellyfinMediaSourceOf';
import { aJellyfinDetail } from './testing/aJellyfinDetail';
import { aJellyfinFilm } from './testing/aJellyfinFilm';

describe('jellyfinMediaSourceOf', () => {
  it('describes the file as one way of playing it', () => {
    expect(jellyfinMediaSourceOf(aJellyfinDetail(aJellyfinFilm()))).toMatchObject({
      Id: '0f8fad5bd9cb469fa16570867728950e',
      Container: 'mkv',
      RunTimeTicks: 75_600_000_000,
      Bitrate: 8_000_000,
      DefaultAudioStreamIndex: 2,
      SupportsDirectPlay: true,
      Protocol: 'File',
    });
  });
});
