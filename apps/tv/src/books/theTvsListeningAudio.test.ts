import type * as TheTvsListeningAudio from '@ValenceTv/books/theTvsListeningAudio';

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

const fresh = (): typeof TheTvsListeningAudio => {
  jest.resetModules();
  mockMade.length = 0;

  return jest.requireActual<typeof TheTvsListeningAudio>('@ValenceTv/books/theTvsListeningAudio');
};

describe('theTvsListeningAudio', () => {
  it('is made once, apart from the music, and plays in the background', () => {
    const { theTvsListeningAudio, theTvsListeningPlayer } = fresh();

    expect(theTvsListeningAudio()).toBe(theTvsListeningAudio());
    expect(mockMade).toHaveLength(1);
    expect(theTvsListeningPlayer()).toBe(mockMade[0]);
    expect(mockSetAudioMode).toHaveBeenCalledWith(
      expect.objectContaining({ shouldPlayInBackground: true }),
    );
  });

  it('makes the audio when the player is asked for first', () => {
    const { theTvsListeningPlayer } = fresh();

    expect(theTvsListeningPlayer()).toBe(mockMade[0]);
    expect(mockMade).toHaveLength(1);
  });
});
