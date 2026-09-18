import { useSyncExternalStore } from 'react';

type MusicVideo = {
  title: string;
  videoKey: string;
};

let showing: MusicVideo | null = null;

const listeners = new Set<() => void>();

/**
 * Shows a song's music video, or puts it away.
 *
 * @param video - The song and its video, or nothing to put it away.
 */
const setMusicVideo = (video: MusicVideo | null): void => {
  showing = video;

  for (const listener of listeners) {
    listener();
  }
};

/**
 * Starts listening for the video changing.
 *
 * @param listener - What to call when it does.
 * @returns A way to stop.
 */
const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

/**
 * Reads which music video is showing, so a menu anywhere in the section can raise it and the one
 * player the section keeps can show it.
 *
 * @returns The video showing, or nothing.
 */
const useMusicVideo = (): MusicVideo | null =>
  useSyncExternalStore(
    subscribe,
    () => showing,
    () => showing,
  );

export type { MusicVideo };

export { setMusicVideo, useMusicVideo };
