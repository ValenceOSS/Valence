const HIDDEN_KEY = 'valence.setupGuideHidden';

const VISITED_KEY = 'valence.setupGuideVisited';

/**
 * Whether the setup guide has been put away on this device.
 *
 * @returns Whether somebody chose to hide it.
 */
const isSetupGuideHidden = (): boolean => {
  try {
    return window.localStorage.getItem(HIDDEN_KEY) === 'true';
  } catch {
    return false;
  }
};

/**
 * Puts the setup guide away on this device, for good.
 */
const hideSetupGuide = (): void => {
  try {
    window.localStorage.setItem(HIDDEN_KEY, 'true');
  } catch {}
};

/**
 * Whether this device has already been taken to the libraries page to start setting up.
 *
 * @returns Whether it has.
 */
const hasBeenTakenToSetup = (): boolean => {
  try {
    return window.localStorage.getItem(VISITED_KEY) === 'true';
  } catch {
    return true;
  }
};

/**
 * Remembers that this device has been taken to the libraries page, so it is done once rather than
 * every time the admin page opens on a server that still has nothing in it.
 */
const markTakenToSetup = (): void => {
  try {
    window.localStorage.setItem(VISITED_KEY, 'true');
  } catch {}
};

export { hasBeenTakenToSetup, hideSetupGuide, isSetupGuideHidden, markTakenToSetup };
