import type * as TheTvsMusicAudio from '@ValenceTv/music/theTvsMusicAudio';

const mockMade: object[] = [];

const mockSetAudioMode = jest.fn<Promise<void>, [object]>(() => Promise.resolve());

jest.mock('expo-audio', () => ({
  createAudioPlayer: () => {
    const made = {
      playing: false,
      replace: jest.fn(),
      addListener: () => ({ remove: () => undefined }),
    };

    mockMade.push(made);

    return made;
  },
  setAudioModeAsync: (mode: object) => mockSetAudioMode(mode),
}));

const fresh = (): typeof TheTvsMusicAudio => {
  jest.resetModules();
  mockMade.length = 0;

  return jest.requireActual<typeof TheTvsMusicAudio>('@ValenceTv/music/theTvsMusicAudio');
};

describe('theTvsMusicAudio', () => {
  it('is made once, and plays in the background', () => {
    const { theTvsMusicAudio, theTvsMusicPlayer } = fresh();

    expect(theTvsMusicAudio()).toBe(theTvsMusicAudio());
    expect(mockMade).toHaveLength(1);
    expect(theTvsMusicPlayer()).toBe(mockMade[0]);
    expect(mockSetAudioMode).toHaveBeenCalledWith(
      expect.objectContaining({ shouldPlayInBackground: true }),
    );
  });

  it('plays every kind of file but Ogg', () => {
    const { canPlay } = fresh().theTvsMusicAudio();

    expect(canPlay('audio/flac')).toBe(true);
    expect(canPlay('audio/ogg; codecs="opus"')).toBe(false);
    expect(canPlay('audio/ogg; codecs="vorbis"')).toBe(false);
  });

  it('makes the audio when the player is asked for first', () => {
    const { theTvsMusicPlayer } = fresh();

    expect(theTvsMusicPlayer()).toBe(mockMade[0]);
    expect(mockMade).toHaveLength(1);
  });
});
