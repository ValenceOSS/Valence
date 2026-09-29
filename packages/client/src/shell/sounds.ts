import { platformInUse } from '@ValenceClient/platform/installPlatform';

const STORAGE_KEY = 'valence.sounds';

const ON = 'on';

const listeners = new Set<(isOn: boolean) => void>();

/**
 * Whether somebody has asked this device for the interface's sounds, which it does not play until
 * they have: a click or a chime nobody asked for is a surprise, and the kind that sends people
 * looking for the mute button rather than the setting.
 *
 * @returns Whether sounds are on.
 */
const chosenSounds = (): boolean => platformInUse().store.read(STORAGE_KEY) === ON;

/**
 * Remembers whether sounds are on and tells whoever plays them.
 *
 * @param isOn - Whether to play them.
 */
const chooseSounds = (isOn: boolean): void => {
  const { store } = platformInUse();

  if (isOn) {
    store.write(STORAGE_KEY, ON);
  } else {
    store.forget(STORAGE_KEY);
  }

  for (const listener of listeners) {
    listener(isOn);
  }
};

/**
 * Watches for sounds being turned on or off.
 *
 * @param listener - Told whenever it changes.
 * @returns A way to stop listening.
 */
const whenSoundsChange = (listener: (isOn: boolean) => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export { chooseSounds, chosenSounds, whenSoundsChange };
