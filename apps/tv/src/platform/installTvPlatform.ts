import Constants from 'expo-constants';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { noFilesAreKept } from '@ValenceClient/platform/noFilesAreKept';
import { describeThisTv } from '@ValenceTv/platform/describeThisTv';
import { pointFetchAtTheServer } from '@ValenceTv/platform/pointFetchAtTheServer';
import { theTvsReach } from '@ValenceTv/platform/theTvsReach';
import { theTvsSocket } from '@ValenceTv/platform/theTvsSocket';
import { theTvsStore } from '@ValenceTv/platform/theTvsStore';
import { thisTvsId } from '@ValenceTv/platform/thisTvsId';

/**
 * Tells the application it is running on a television, which is the first thing that has to happen.
 *
 * `fetch` is aimed at the server before anything else is installed, because a television is served
 * by nothing and every request the application makes is a path until it is put somewhere.
 *
 * A television keeps no files, so it holds nothing to watch offline. It has no notification centre a
 * page could post to and no badge on its icon, so those answer nothing.
 */
const installTvPlatform = (): void => {
  pointFetchAtTheServer();

  installPlatform({
    store: theTvsStore(),
    describeThisClient: () => describeThisTv(Constants.deviceName ?? null),
    thisClientId: thisTvsId,
    thisClientKind: () => 'tv',
    canKeepFiles: () => false,
    held: noFilesAreKept(),
    reachability: theTvsReach(),
    openSocket: theTvsSocket,
    buildInfo: () => null,
    notifyLocally: () => undefined,
    setUnreadBadge: () => undefined,
  });
};

export { installTvPlatform };
