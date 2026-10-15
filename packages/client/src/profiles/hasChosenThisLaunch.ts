import { CHOSEN_THIS_LAUNCH } from './CHOSEN_THIS_LAUNCH';
import { launchStore } from './launchStore';

/**
 * Whether somebody has chosen who is watching since the app was started, which is what decides
 * whether to ask again: every start of the app asks, as a shared screen should.
 *
 * @param accountId - Whose account, since one device can hold several.
 * @returns Whether a profile was chosen since the app started.
 */
const hasChosenThisLaunch = (accountId: string): boolean =>
  launchStore().read(CHOSEN_THIS_LAUNCH) === accountId;

export { hasChosenThisLaunch };
