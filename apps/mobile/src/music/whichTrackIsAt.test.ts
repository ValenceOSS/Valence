import { whichTrackIsAt } from './whichTrackIsAt';

const SONG = '00000000-0000-4000-8000-00000000c0c0';

describe('whichTrackIsAt', () => {
  it('reads the track and quality a stream is asked for at', () => {
    expect(whichTrackIsAt(`/api/music/tracks/${SONG}/stream?quality=normal`)).toEqual({
      trackId: SONG,
      quality: 'normal',
    });
  });

  it('sends a song kept on the phone from the server’s high-quality encode', () => {
    expect(whichTrackIsAt(`file:///kept/track-${SONG}-lossless.flac`)).toEqual({
      trackId: SONG,
      quality: 'high',
    });
  });

  it('names nothing where the address is no track', () => {
    expect(whichTrackIsAt('')).toBeNull();
    expect(whichTrackIsAt('/api/books/x/stream')).toBeNull();
  });
});
