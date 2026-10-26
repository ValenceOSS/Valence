import { theBrowsersKeptAnswers } from '@ValenceScreens/admin/theBrowsersKeptAnswers';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { theKeptListening } from '@ValenceClient/downloads/theKeptListening';
import { theBrowserAudio } from '@ValenceScreens/music/theBrowserAudio';
import { theBrowsersListeningAudio } from '@ValenceScreens/listening/theBrowsersListeningAudio';
import { theDesktopsStore } from '@ValenceDesktop/platform/theDesktopsStore';
import { describeThisDesktop } from '@ValenceDesktop/platform/describeThisDesktop';
import { thisWindowsId } from '@ValenceDesktop/platform/thisWindowsId';
import { theDesktopsSocket } from '@ValenceDesktop/platform/theDesktopsSocket';
import { theDesktopsHeldFiles } from '@ValenceDesktop/platform/theDesktopsHeldFiles';
import { theDesktopsListeningFiles } from '@ValenceDesktop/platform/theDesktopsListeningFiles';
import { theDesktopsReach } from '@ValenceDesktop/platform/theDesktopsReach';
import { notifyLocally, setUnreadBadge } from '@ValenceDesktop/platform/theDesktopsNotifications';
import { theDesktopsPasskeys } from '@ValenceDesktop/platform/theDesktopsPasskeys';
import { say } from '@ValenceI18n/say';

const PICK_UP_DOWNLOADS_AFTER = 3000;

/**
 * Tells the application what it is running on, when what it is running on is this client.
 *
 * Six answers, which is all a host is. Preferences go to a file the window's own process keeps,
 * rather than to web storage, because this client has no origin to hang storage off and would forget
 * which server it watches every time it was rebuilt. What lasts only until it quits is held by that
 * process too, in memory, since a page on this client's own scheme cannot keep cookies. The rest is the same shape a browser fills in. Music and audiobooks left downloading are picked up a few seconds after the window opens.
 */
const installDesktopPlatform = (): void => {
  installPlatform({
    store: theDesktopsStore(window.valence.preferences),
    thisLaunch: theDesktopsStore(window.valence.thisLaunch),
    kept: theBrowsersKeptAnswers(() => window.indexedDB),
    serverAddress: () => null,
    describeThisClient: () => describeThisDesktop(navigator.userAgent),
    thisClientId: thisWindowsId,
    thisClientKind: () => 'desktop',
    canKeepFiles: () => true,
    held: theDesktopsHeldFiles(),
    listeningFiles: theDesktopsListeningFiles(),
    reachability: theDesktopsReach(),
    openSocket: theDesktopsSocket,
    buildInfo: () => {
      const { version, commit, arch, electron, chrome } = window.valence.about;

      return {
        version,
        commit,
        runsOn: say('desktop.platform.installDesktopPlatform.archElectronElectronChromiumChrome', {
          arch,
          electron,
          chrome,
        }),
      };
    },
    notifyLocally,
    setUnreadBadge,
    musicAudio: theBrowserAudio,
    listeningAudio: theBrowsersListeningAudio,
    passkeys: theDesktopsPasskeys,
  });
  setTimeout(theKeptListening, PICK_UP_DOWNLOADS_AFTER);
};

export { installDesktopPlatform };
