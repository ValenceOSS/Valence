import { vi } from 'vitest';
import { createAudiobookPlayer } from '@ValenceClient/books/createAudiobookPlayer';
import type { AudiobookPlayer, ListeningAudio } from '@ValenceClient/books/createAudiobookPlayer';

type FakeAudio = ListeningAudio & { fire: (type: string) => void };

/**
 * An audiobook player over an audio element that plays nothing, whose events a test fires by hand,
 * keeping somewhere the test can see.
 *
 * @returns The player, its audio, and what it was asked to keep.
 */
const aFakeAudiobookPlayer = (): {
  player: AudiobookPlayer;
  audio: FakeAudio;
  save: ReturnType<typeof vi.fn>;
} => {
  const listeners = new Map<string, Array<() => void>>();
  const audio: FakeAudio = {
    src: '',
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    paused: true,
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    addEventListener: (type, listener) => {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    fire: (type) => {
      (listeners.get(type) ?? []).forEach((listener) => {
        listener();
      });
    },
  };
  const save = vi.fn();
  const player = createAudiobookPlayer({
    audio,
    addressOf: (bookId, trackId) => `/api/books/${bookId}/chapters/${trackId}/audio`,
    save,
    now: () => 0,
  });

  return { player, audio, save };
};

export { aFakeAudiobookPlayer };
