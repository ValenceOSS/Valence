import type * as PlayInTheBackground from '@ValenceTv/audio/playInTheBackground';

const mockSetAudioMode = jest.fn<Promise<void>, [object]>(() => Promise.resolve());

jest.mock('expo-audio', () => ({
  setAudioModeAsync: (mode: object) => mockSetAudioMode(mode),
}));

describe('playInTheBackground', () => {
  it('asks the television once, however many players ask', () => {
    const { playInTheBackground } = jest.requireActual<typeof PlayInTheBackground>(
      '@ValenceTv/audio/playInTheBackground',
    );

    playInTheBackground();
    playInTheBackground();

    expect(mockSetAudioMode).toHaveBeenCalledTimes(1);
    expect(mockSetAudioMode).toHaveBeenCalledWith(
      expect.objectContaining({ shouldPlayInBackground: true, interruptionMode: 'doNotMix' }),
    );
  });
});
