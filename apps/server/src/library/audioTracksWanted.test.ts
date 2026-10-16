import { describe, expect, it } from 'vitest';
import { audioTracksWanted } from './audioTracksWanted';

describe('audioTracksWanted', () => {
  it('wants nothing where nothing was chosen', () => {
    expect(audioTracksWanted({ languages: [], codecs: [], channels: [] })).toEqual([]);
  });

  it('asks for one track holding every kind of choice at once', () => {
    expect(audioTracksWanted({ languages: ['jpn'], codecs: [], channels: [6] })).toEqual([
      { language: 'jpn', channels: 6 },
    ]);
  });

  it('takes any of several choices of one kind', () => {
    expect(
      audioTracksWanted({ languages: ['en', 'eng'], codecs: ['truehd'], channels: [] }),
    ).toEqual([
      { language: 'en', codec: 'truehd' },
      { language: 'eng', codec: 'truehd' },
    ]);
  });

  it('asks for Atmos as a quality of the track rather than as a codec', () => {
    expect(audioTracksWanted({ languages: [], codecs: ['atmos', 'dts'], channels: [] })).toEqual([
      { isAtmos: true },
      { codec: 'dts' },
    ]);
  });
});
