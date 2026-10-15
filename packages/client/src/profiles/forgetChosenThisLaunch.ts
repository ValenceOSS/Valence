import { CHOSEN_THIS_LAUNCH } from './CHOSEN_THIS_LAUNCH';
import { launchStore } from './launchStore';

/**
 * Forgets that anybody chose who is watching, so the app asks again.
 */
const forgetChosenThisLaunch = (): void => {
  launchStore().forget(CHOSEN_THIS_LAUNCH);
};

export { forgetChosenThisLaunch };
