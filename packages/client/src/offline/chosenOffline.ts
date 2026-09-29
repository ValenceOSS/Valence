import { platformInUse } from '@ValenceClient/platform/installPlatform';

const STORAGE_KEY = 'valence.offline.chosen';

const following = new Set<(isChosen: boolean) => void>();

/**
 * Whether somebody has said they want to be offline, whatever the network is doing.
 *
 * Worth being able to say. Offline mode arriving on its own is the common case, but the case that
 * matters most is the one where somebody knows what is about to happen and the application does
 * not: an hour before a flight, on wifi that still works, wanting to see now whether what they meant
 * to take is actually on the laptop. Making them wait until the aeroplane to find out is exactly the
 * moment it is too late to fix.
 *
 * Kept on the device rather than on the account, because it is a fact about this machine on this
 * trip and not about the person. Their desktop at home should not go dark because they went offline
 * on a laptop.
 *
 * @returns Whether offline was asked for.
 */
const chosenOffline = (): boolean => platformInUse().store.read(STORAGE_KEY) === 'yes';

/**
 * Remembers that somebody wants to be offline, or that they no longer do.
 *
 * @param isChosen - What they asked for.
 */
const chooseOffline = (isChosen: boolean): void => {
  const { store } = platformInUse();

  if (isChosen) {
    store.write(STORAGE_KEY, 'yes');
  } else {
    store.forget(STORAGE_KEY);
  }

  for (const listener of following) {
    listener(isChosen);
  }
};

/**
 * Tells a listener whenever somebody goes offline or comes back, wherever in the application they
 * asked, so every part of it that cares follows the same answer.
 *
 * @param listener - Told what was asked for.
 * @returns A way to stop telling it.
 */
const followChosenOffline = (listener: (isChosen: boolean) => void): (() => void) => {
  following.add(listener);

  return () => {
    following.delete(listener);
  };
};

export { STORAGE_KEY, chooseOffline, chosenOffline, followChosenOffline };
