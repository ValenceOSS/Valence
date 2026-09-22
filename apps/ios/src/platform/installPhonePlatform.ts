import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { noFilesAreKept } from '@ValenceClient/platform/noFilesAreKept';
import { describeThisPhone } from '@ValencePhone/platform/describeThisPhone';
import { giveThisPhoneAnOrigin } from '@ValencePhone/platform/giveThisPhoneAnOrigin';
import { giveThisPhoneCrypto } from '@ValencePhone/platform/giveThisPhoneCrypto';
import { thePhonesReach } from '@ValencePhone/platform/thePhonesReach';
import { thePhonesSocket } from '@ValencePhone/platform/thePhonesSocket';
import { thePhonesStore } from '@ValencePhone/platform/thePhonesStore';
import { theServerThisPhoneWatches } from '@ValencePhone/platform/theServerThisPhoneWatches';
import { thisPhonesId } from '@ValencePhone/platform/thisPhonesId';

/**
 * Tells the application it is running on a phone, which is the first thing that has to happen —
 * before anything reads a preference or says who is watching.
 *
 * Takes what the phone remembered rather than reading it, because reading phone storage is
 * asynchronous and everything above here expects an answer at once. Whoever starts the application
 * does the waiting, once.
 *
 * Keeping files is answered no for now. A phone is the client that most wants downloads and it
 * will have them, but claiming the ability before it exists offers somebody a button that does
 * nothing.
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
    canKeepFiles: () => false,
    held: noFilesAreKept(),
    reachability: thePhonesReach(),
    openSocket: thePhonesSocket(store),
  });
};

export { installPhonePlatform };
