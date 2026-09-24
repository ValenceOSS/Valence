import AsyncStorage from '@react-native-async-storage/async-storage';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { thePhonesMusicOut } from '@ValencePhone/music/thePhonesMusicOut';
import { describeThisPhone } from '@ValencePhone/platform/describeThisPhone';
import { giveThisPhoneAnOrigin } from '@ValencePhone/platform/giveThisPhoneAnOrigin';
import { giveThisPhoneCrypto } from '@ValencePhone/platform/giveThisPhoneCrypto';
import { thePhonesBuild } from '@ValencePhone/platform/thePhonesBuild';
import { thePhonesReach } from '@ValencePhone/platform/thePhonesReach';
import { thePhonesSocket } from '@ValencePhone/platform/thePhonesSocket';
import { thePhonesStore } from '@ValencePhone/platform/thePhonesStore';
import { thePhonesHeldFiles } from '@ValencePhone/platform/thePhonesHeldFiles';
import { theServerThisPhoneWatches } from '@ValencePhone/platform/theServerThisPhoneWatches';
import { thisPhonesId } from '@ValencePhone/platform/thisPhonesId';

const PICK_UP_DOWNLOADS_AFTER = 3000;

/**
 * Tells the application it is running on a phone, which is the first thing that has to happen —
 * before anything reads a preference or says who is watching.
 *
 * Takes what the phone remembered rather than reading it, because reading phone storage is
 * asynchronous and everything above here expects an answer at once. Whoever starts the application
 * does the waiting, once.
 *
 * Downloads the app closed partway through are picked up a few seconds later, once the first
 * screen is up, rather than competing with it.
 *
 * @param held - What the phone remembered, read at startup.
 */
const installPhonePlatform = (held: Map<string, string>): void => {
  const store = thePhonesStore(held);

  giveThisPhoneCrypto();
  giveThisPhoneAnOrigin(store);

  installPlatform({
    store,
    serverAddress: () => theServerThisPhoneWatches(store),
    describeThisClient: describeThisPhone,
    thisClientId: () => thisPhonesId(store),
    thisClientKind: () => 'phone',
    canKeepFiles: () => true,
    held: thePhonesHeldFiles(
      store,
      (key) => AsyncStorage.getItem(key),
      (run) => {
        setTimeout(run, PICK_UP_DOWNLOADS_AFTER);
      },
    ),
    reachability: thePhonesReach(),
    openSocket: thePhonesSocket(store),
    buildInfo: thePhonesBuild,
    notifyLocally: () => {},
    setUnreadBadge: () => {},
    musicAudio: thePhonesMusicOut,
  });
};

export { installPhonePlatform };
