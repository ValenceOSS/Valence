import type { NativeMusic } from '@ValencePhone/music/NativeMusic.types';

/**
 * The phone's music module, playing nothing and remembering what it was told, with a way to have
 * it say what happened as a real one would, and to press its lock screen's buttons.
 *
 * @returns The module, and ways to make it speak.
 */
const aFakeSpeaker = (): {
  speaker: NativeMusic & Record<Exclude<keyof NativeMusic, 'addListener'>, jest.Mock>;
  say: (said: object) => void;
  press: (said: object) => void;
} => {
  const heard = new Map<string, Set<(said: object) => void>>();
  const tell = (event: string, said: object): void => {
    heard.get(event)?.forEach((listener) => {
      listener(said);
    });
  };
  const speaker = {
    load: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    seek: jest.fn(),
    setRate: jest.fn(),
    setVolume: jest.fn(),
    setMuted: jest.fn(),
    describe: jest.fn(),
    stop: jest.fn(),
    addListener: (event: 'onAudio' | 'onRemote', listener: (said: object) => void) => {
      const held = heard.get(event) ?? new Set<(said: object) => void>();

      held.add(listener);
      heard.set(event, held);

      return {
        remove: () => {
          held.delete(listener);
        },
      };
    },
  };

  return {
    speaker,
    say: (said) => {
      tell('onAudio', said);
    },
    press: (said) => {
      tell('onRemote', said);
    },
  };
};

export { aFakeSpeaker };
