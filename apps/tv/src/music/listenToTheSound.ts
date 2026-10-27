import { theTvsMusicPlayer, whenTheTvsMusicPlayerChanges } from '@ValenceTv/music/theTvsMusicAudio';
import type { AudioPlayer } from 'expo-audio';

const listeners = new Set<(frames: readonly number[]) => void>();

let heard: { from: AudioPlayer; hearing: ReturnType<AudioPlayer['addListener']> } | null = null;

let following: (() => void) | null = null;

/**
 * Listens to a player's sound, a short run of samples at a time, passing each on to whoever asked.
 *
 * @param system - The player to listen to.
 */
const listenTo = (system: AudioPlayer): void => {
  system.setAudioSamplingEnabled(true);
  heard = {
    from: system,
    hearing: system.addListener('audioSampleUpdate', (sample) => {
      const frames = sample.channels[0]?.frames;

      if (frames !== undefined && frames.length > 0) {
        listeners.forEach((each) => {
          each(frames);
        });
      }
    }),
  };
};

/**
 * Stops listening to whichever player was being listened to.
 */
const stopListening = (): void => {
  if (heard === null) {
    return;
  }

  heard.hearing.remove();
  heard.from.setAudioSamplingEnabled(false);
  heard = null;
};

/**
 * Hears the music the television plays as it plays, a short run of samples at a time, for the bars
 * that move to it. The system is asked for the samples only while somebody is listening, and the
 * listening follows the music when it moves on to the television's other player.
 *
 * @param listener - Told each run of samples.
 * @returns A way to stop hearing.
 */
const listenToTheSound = (listener: (frames: readonly number[]) => void): (() => void) => {
  listeners.add(listener);

  if (heard === null) {
    listenTo(theTvsMusicPlayer());
    following = whenTheTvsMusicPlayerChanges((playing) => {
      stopListening();
      listenTo(playing);
    });
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      stopListening();
      following?.();
      following = null;
    }
  };
};

export { listenToTheSound };
