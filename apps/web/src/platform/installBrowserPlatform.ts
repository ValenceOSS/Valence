import { detectClientKind } from '@ValenceClient/playback/detectClientKind';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { theBrowsersStore } from '@ValenceWeb/platform/browserStore';
import { describeThisBrowser } from '@ValenceWeb/platform/describeThisBrowser';
import { noFilesAreKept } from '@ValenceClient/platform/noFilesAreKept';
import { thisTabsId } from '@ValenceWeb/platform/thisTabsId';
import { theBrowsersReach } from '@ValenceWeb/platform/theBrowsersReach';
import { openRealtimeSocket } from '@ValenceWeb/realtime/openRealtimeSocket';

/**
 * Tells the application it is running in a browser, which is the first thing that has to happen —
 * before anything reads a preference or says who is watching.
 *
 * A browser answers nothing about notifying locally or badging itself: a tab already has the real
 * mechanism for both, a service worker's own push event and (where a browser offers it) the Badging
 * API, and a second notification fired from the page itself would only ever be a duplicate of one
 * the worker already showed.
 */
const installBrowserPlatform = (): void => {
  installPlatform({
    store: theBrowsersStore(),
    serverAddress: () => null,
    describeThisClient: describeThisBrowser,
    thisClientId: thisTabsId,
    thisClientKind: () => detectClientKind(navigator.userAgent),
    canKeepFiles: () => false,
    held: noFilesAreKept(),
    reachability: theBrowsersReach(),
    openSocket: openRealtimeSocket,
    buildInfo: () => null,
    notifyLocally: () => {},
    setUnreadBadge: () => {},
  });
};

export { installBrowserPlatform };
