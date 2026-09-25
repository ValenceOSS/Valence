import AsyncStorage from '@react-native-async-storage/async-storage';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { thePhonesMusicOut } from '@ValenceMobile/music/thePhonesMusicOut';
import { thePhonesListeningAudio } from '@ValenceMobile/books/thePhonesListeningAudio';
import { describeThisPhone } from '@ValenceMobile/platform/describeThisPhone';
import { giveThisPhoneAnOrigin } from '@ValenceMobile/platform/giveThisPhoneAnOrigin';
import { giveThisPhoneCrypto } from '@ValenceMobile/platform/giveThisPhoneCrypto';
import { thePhonesBuild } from '@ValenceMobile/platform/thePhonesBuild';
import { thePhonesReach } from '@ValenceMobile/platform/thePhonesReach';
import { thePhonesSocket } from '@ValenceMobile/platform/thePhonesSocket';
import { thePhonesStore } from '@ValenceMobile/platform/thePhonesStore';
import { thePhonesHeldFiles } from '@ValenceMobile/platform/thePhonesHeldFiles';
import { theServerThisPhoneWatches } from '@ValenceMobile/platform/theServerThisPhoneWatches';
import { thisPhonesId } from '@ValenceMobile/platform/thisPhonesId';

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
    listeningAudio: thePhonesListeningAudio,
  });
};

export { installPhonePlatform };
