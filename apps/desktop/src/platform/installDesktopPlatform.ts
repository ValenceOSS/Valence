import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { theDesktopsStore } from '@ValenceDesktop/platform/theDesktopsStore';
import { describeThisDesktop } from '@ValenceDesktop/platform/describeThisDesktop';
import { thisWindowsId } from '@ValenceDesktop/platform/thisWindowsId';
import { theDesktopsSocket } from '@ValenceDesktop/platform/theDesktopsSocket';
import { theDesktopsHeldFiles } from '@ValenceDesktop/platform/theDesktopsHeldFiles';
import { theDesktopsReach } from '@ValenceDesktop/platform/theDesktopsReach';
import { notifyLocally, setUnreadBadge } from '@ValenceDesktop/platform/theDesktopsNotifications';

/**
 * Tells the application what it is running on, when what it is running on is this client.
 *
 * Six answers, which is all a host is. Preferences go to a file the window's own process keeps,
 * rather than to web storage, because this client has no origin to hang storage off and would forget
 * which server it watches every time it was rebuilt. The rest is the same shape a browser fills in.
 */
const installDesktopPlatform = (): void => {
  installPlatform({
    store: theDesktopsStore(),
    serverAddress: () => null,
    describeThisClient: () => describeThisDesktop(navigator.userAgent),
    thisClientId: thisWindowsId,
    thisClientKind: () => 'desktop',
    canKeepFiles: () => true,
    held: theDesktopsHeldFiles(),
    reachability: theDesktopsReach(),
    openSocket: theDesktopsSocket,
    buildInfo: () => {
      const { version, commit, arch, electron, chrome } = window.valence.about;

      return { version, commit, runsOn: `${arch} · Electron ${electron} · Chromium ${chrome}` };
    },
    notifyLocally,
    setUnreadBadge,
  });
};

export { installDesktopPlatform };
