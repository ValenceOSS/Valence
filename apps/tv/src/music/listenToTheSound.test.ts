import type * as ListenToTheSound from '@ValenceTv/music/listenToTheSound';

type Sample = { channels: { frames: number[] }[] };

const mockHeard: ((sample: Sample) => void)[] = [];

const mockRemove = jest.fn();

const mockSampling = jest.fn();

jest.mock('@ValenceTv/music/theTvsMusicAudio', () => ({
  theTvsMusicPlayer: () => ({
    setAudioSamplingEnabled: (isOn: boolean) => {
      mockSampling(isOn);
    },
    addListener: (_event: string, listener: (sample: Sample) => void) => {
      mockHeard.push(listener);

      return { remove: mockRemove };
    },
  }),
}));

const fresh = (): typeof ListenToTheSound.listenToTheSound => {
  jest.resetModules();
  mockHeard.length = 0;
  mockRemove.mockClear();
  mockSampling.mockClear();

  return jest.requireActual<typeof ListenToTheSound>('@ValenceTv/music/listenToTheSound')
    .listenToTheSound;
};

const play = (sample: Sample): void => {
  for (const listener of mockHeard) {
    listener(sample);
  }
};

describe('listenToTheSound', () => {
  it('asks the system for samples and passes on the first channel', () => {
    const listenToTheSound = fresh();
    const one = jest.fn();
    const other = jest.fn();

    listenToTheSound(one);
    listenToTheSound(other);
    play({ channels: [{ frames: [0.1, 0.2] }, { frames: [0.9] }] });

    expect(mockSampling).toHaveBeenCalledTimes(1);
    expect(mockSampling).toHaveBeenCalledWith(true);
    expect(mockHeard).toHaveLength(1);
    expect(one).toHaveBeenCalledWith([0.1, 0.2]);
    expect(other).toHaveBeenCalledWith([0.1, 0.2]);
  });

  it('passes on nothing for an empty block', () => {
    const listenToTheSound = fresh();
    const listener = jest.fn();

    listenToTheSound(listener);
    play({ channels: [] });
    play({ channels: [{ frames: [] }] });

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops the system sampling once the last listener goes', () => {
    const listenToTheSound = fresh();
    const stopOne = listenToTheSound(jest.fn());
    const stopOther = listenToTheSound(jest.fn());

    stopOne();

    expect(mockRemove).not.toHaveBeenCalled();

    stopOther();

    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockSampling).toHaveBeenLastCalledWith(false);
  });

  it('starts sampling again for a listener after everyone had gone', () => {
    const listenToTheSound = fresh();

    listenToTheSound(jest.fn())();
    listenToTheSound(jest.fn());

    expect(mockHeard).toHaveLength(2);
    expect(mockSampling.mock.calls).toEqual([[true], [false], [true]]);
  });
});
