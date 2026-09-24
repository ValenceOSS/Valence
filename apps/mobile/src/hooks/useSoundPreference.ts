import { useCallback, useSyncExternalStore } from 'react';
import { readSoundPreference, saveSoundPreference } from '@ValenceClient/playback/soundPreference';

const listeners = new Set<() => void>();

let isMuted: boolean | null = null;

/**
 * Whether previews are silent right now, read from what was saved the first time it is asked.
 *
 * @returns Whether they are.
 */
const isMutedNow = (): boolean => {
  isMuted ??= readSoundPreference() === 'muted';

  return isMuted;
};

/**
 * Listens for the sound being turned on or off anywhere.
 *
 * @param listener - Told when it is.
 * @returns What stops listening.
 */
const listen = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

/**
 * Whether previews play silently, as somebody last chose, and a way to change it — one choice for
 * every preview on every screen, so turning the sound on for one leaves it on for the next rather
 * than each preview remembering its own. It is saved, so it is still the choice next time.
 *
 * @returns Whether previews are silent, and what turns the sound on or off.
 */
const useSoundPreference = (): { isMuted: boolean; toggle: () => void } => {
  const muted = useSyncExternalStore(listen, isMutedNow);

  const toggle = useCallback(() => {
    isMuted = !isMutedNow();
    saveSoundPreference(isMuted ? 'muted' : 'audible');
    listeners.forEach((listener) => {
      listener();
    });
  }, []);

  return { isMuted: muted, toggle };
};

export { useSoundPreference };
