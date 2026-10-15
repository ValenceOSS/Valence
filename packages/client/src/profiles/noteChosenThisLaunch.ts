import { CHOSEN_THIS_LAUNCH } from './CHOSEN_THIS_LAUNCH';
import { launchStore } from './launchStore';

/**
 * Notes that somebody chose who is watching, so the app does not ask again until it starts again or
 * somebody switches.
 *
 * @param accountId - Whose account.
 */
const noteChosenThisLaunch = (accountId: string): void => {
  launchStore().write(CHOSEN_THIS_LAUNCH, accountId);
};

export { noteChosenThisLaunch };
