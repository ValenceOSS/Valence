import { theTvsMusicPlayer } from '@ValenceTv/music/theTvsMusicAudio';
import type { AudioPlayer } from 'expo-audio';

const listeners = new Set<(frames: readonly number[]) => void>();

let heard: ReturnType<AudioPlayer['addListener']> | null = null;

/**
 * Hears the music as it plays: the samples the system's player has just sent to the speakers, a
 * block at a time. The system is asked to hand them over only while something is listening, since
 * reading them costs something on every block.
 *
 * @param listener - Told each block of samples, from the first channel.
 * @returns What to call to stop listening.
 */
const listenToTheSound = (listener: (frames: readonly number[]) => void): (() => void) => {
  const system = theTvsMusicPlayer();

  listeners.add(listener);

  if (heard === null) {
    system.setAudioSamplingEnabled(true);
    heard = system.addListener('audioSampleUpdate', (sample) => {
      const frames = sample.channels[0]?.frames;

      if (frames !== undefined && frames.length > 0) {
        listeners.forEach((each) => {
          each(frames);
        });
      }
    });
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && heard !== null) {
      heard.remove();
      heard = null;
      system.setAudioSamplingEnabled(false);
    }
  };
};

export { listenToTheSound };
