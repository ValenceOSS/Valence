import { carryTheDevice } from '@ValenceClient/platform/carryTheDevice';
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
 * Tells the application it is running in Valence's own window, with preferences and this launch's
 * values kept by the host, files and reach answered by it, and music and audiobooks left
 * downloading picked up a few seconds after the window opens.
 */
const installDesktopPlatform = (): void => {
  installPlatform({
    store: theDesktopsStore(window.valence.preferences),
    thisLaunch: theDesktopsStore(window.valence.thisLaunch),
    kept: theBrowsersKeptAnswers(() => window.indexedDB),
    serverAddress: () => null,
    describeThisClient: () => describeThisDesktop(navigator.userAgent),
    describeThisDevice: () => {
      const name = window.valence.about.computerName;

      return { app: 'desktop', ...(name === null ? {} : { name }) };
    },
    thisClientId: thisWindowsId,
    thisClientKind: () => 'desktop',
    canKeepFiles: () => true,
    held: theDesktopsHeldFiles(),
    listeningFiles: theDesktopsListeningFiles(),
    reachability: theDesktopsReach(),
    openSocket: theDesktopsSocket,
    buildInfo: () => {
      const { version, isADevBuild, commit, arch, webview, tauri } = window.valence.about;

      return {
        version,
        isADevBuild,
        commit,
        runsOn: say('desktop.platform.installDesktopPlatform.archWebviewTauriTauri', {
          arch,
          webview,
          tauri,
        }),
      };
    },
    notifyLocally,
    setUnreadBadge,
    musicAudio: theBrowserAudio,
    listeningAudio: theBrowsersListeningAudio,
    passkeys: theDesktopsPasskeys,
  });
  carryTheDevice();
  setTimeout(theKeptListening, PICK_UP_DOWNLOADS_AFTER);
};

export { installDesktopPlatform };
