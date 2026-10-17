import { ipcMain } from 'electron';
import {
  FORGET_THIS_LAUNCH,
  READ_THIS_LAUNCH,
  WRITE_THIS_LAUNCH,
} from '@ValenceDesktop/main/launchChannels';

/**
 * Lets every window keep what lasts only until the application quits — who chose a profile since it
 * started, and the like — in this process's memory, which every window shares and the next start
 * begins without.
 *
 * A browser keeps this in session cookies. A page served on this client's own scheme has no cookies
 * to keep: whatever it writes to them is gone before it reads them back, so a profile chosen with a
 * PIN would be asked for again at once.
 *
 * Reading is answered synchronously, as a preference is, since it is read while something is drawn.
 * Only strings pass.
 */
const answerAboutThisLaunch = (): void => {
  const kept = new Map<string, string>();

  ipcMain.on(READ_THIS_LAUNCH, (event) => {
    event.returnValue = Object.fromEntries(kept);
  });

  ipcMain.on(WRITE_THIS_LAUNCH, (_event, key: string, value: string) => {
    if (typeof key === 'string' && typeof value === 'string') {
      kept.set(key, value);
    }
  });

  ipcMain.on(FORGET_THIS_LAUNCH, (_event, key: string) => {
    if (typeof key === 'string') {
      kept.delete(key);
    }
  });
};

export { answerAboutThisLaunch };
