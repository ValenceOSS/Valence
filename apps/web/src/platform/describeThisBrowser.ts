import { identifyDevice } from '@ValenceCore/functions/identifyDevice';
import { nameTheClient } from '@ValenceCore/functions/nameTheClient';
import { sayAgain } from '@ValenceI18n/sayAgain';
import { hintsAboutThisBrowser } from '@ValenceWeb/platform/hintsAboutThisBrowser';

/**
 * What to call this browser where one line is all there is room for, such as the name a television
 * shows for the browser casting to it: the browser and the system it runs on, the way the server
 * names it in the sessions list.
 *
 * @returns The browser as a person would describe it.
 */
const describeThisBrowser = (): string =>
  sayAgain(
    nameTheClient(
      identifyDevice({ userAgent: navigator.userAgent, hints: hintsAboutThisBrowser() }),
    ),
  );

export { describeThisBrowser };
