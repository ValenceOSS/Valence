import { createAudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';
import type { AudiobookPlayer, ListeningAudio } from '@ValenceClient/books/createAudiobookPlayer';

type FakeAudio<Spy> = ListeningAudio & { pause: Spy; fire: (type: string) => void };

/**
 * An audiobook player over audio that plays nothing, whose events a test fires by hand, keeping
 * somewhere the test can see, whichever test runner is recording: Vitest on the web, Jest on a
 * native client.
 *
 * @param spy - Makes a function that remembers how it was called, such as `vi.fn` or `jest.fn`.
 * @returns The player, its audio, and what it was asked to keep.
 */
const aFakeAudiobookPlayerWith = <Spy extends () => void>(
  spy: () => Spy,
): { player: AudiobookPlayer; audio: FakeAudio<Spy>; save: Spy } => {
  const listeners = new Map<string, Array<() => void>>();
  const audio: FakeAudio<Spy> = {
    src: '',
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    paused: true,
    play: () => Promise.resolve(),
    pause: spy(),
    addEventListener: (type, listener) => {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    fire: (type) => {
      (listeners.get(type) ?? []).forEach((listener) => {
        listener();
      });
    },
  };
  const save = spy();
  const player = createAudiobookPlayer({
    audio,
    addressOf: (bookId, trackId) => `/api/books/${bookId}/chapters/${trackId}/audio`,
    save,
    now: () => 0,
  });

  return { player, audio, save };
};

export { aFakeAudiobookPlayerWith };
