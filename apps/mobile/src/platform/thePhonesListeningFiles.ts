import {
  createDownloadResumable,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';
import { AppState } from 'react-native';
import { canThisPhonePlay } from '@ValenceMobile/music/canThisPhonePlay';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import type { DownloadResumable } from 'expo-file-system/legacy';
import type { ListeningFiles } from '@ValenceClient/platform/Platform.types';
import { say } from '@ValenceI18n/say';

const FOLDER = `${documentDirectory ?? ''}listening/`;

const TRIES_AFTER_LEAVING = 3;

/**
 * Where a kept song, audiobook track or cover is on this phone.
 *
 * @param name - The file's name.
 * @returns Its address, as a player or an image reads a file.
 */
const pathOf = (name: string): string => `${FOLDER}${name}`;

/**
 * Waits until the app is in front again, at once where it already is.
 *
 * @returns When it is.
 */
const theAppIsBack = (): Promise<void> =>
  AppState.currentState === 'active'
    ? Promise.resolve()
    : new Promise((settle) => {
        const hearing = AppState.addEventListener('change', (state) => {
          if (state === 'active') {
            hearing.remove();
            settle();
          }
        });
      });

/**
 * The songs, audiobook tracks and covers this phone keeps, each fetched from this phone's server
 * with this phone's session into a folder of their own, started again from the beginning when a
 * fetch is stopped partway, since none is long, and tried again once the app is back where the
 * phone broke one off while the app was away.
 *
 * @returns What the platform keeps them through.
 */
const thePhonesListeningFiles = (): ListeningFiles => {
  const transfers = new Map<string, DownloadResumable>();
  let timesLeft = 0;

  AppState.addEventListener('change', (state) => {
    if (state !== 'active') {
      timesLeft += 1;
    }
  });

  return {
    fetch: async (from, name, report) => {
      await makeDirectoryAsync(FOLDER, { intermediates: true }).catch(() => undefined);

      const address = onThisServer(from);
      const cookie = await theCookiesThisPhoneHolds(address);
      let done: Awaited<ReturnType<DownloadResumable['downloadAsync']>> | null = null;
      let wasStopped = false;

      for (let tried = 0; tried <= TRIES_AFTER_LEAVING; tried += 1) {
        const leftBefore = timesLeft;
        const transfer = createDownloadResumable(
          address,
          pathOf(name),
          cookie === null ? {} : { headers: { Cookie: cookie } },
          (progress) => {
            report(
              progress.totalBytesWritten,
              progress.totalBytesExpectedToWrite > 0 ? progress.totalBytesExpectedToWrite : null,
            );
          },
        );

        transfers.set(name, transfer);
        done = await transfer.downloadAsync().catch(() => null);
        wasStopped = transfers.get(name) !== transfer;
        transfers.delete(name);

        if (
          wasStopped ||
          done !== null ||
          timesLeft === leftBefore ||
          tried === TRIES_AFTER_LEAVING
        ) {
          break;
        }

        await theAppIsBack();
      }

      if (wasStopped || done === undefined) {
        await deleteAsync(pathOf(name), { idempotent: true }).catch(() => undefined);

        return { bytes: 0, isComplete: false, failure: null };
      }

      if (done === null || done.status !== 200) {
        await deleteAsync(pathOf(name), { idempotent: true }).catch(() => undefined);

        return {
          bytes: 0,
          isComplete: false,
          failure: say('phone.platform.thePhonesHeldFiles.theFileCouldNotBeFetched'),
        };
      }

      const onTheDisk = await getInfoAsync(pathOf(name)).catch(() => null);

      return onTheDisk !== null && onTheDisk.exists
        ? { bytes: onTheDisk.size, isComplete: true, failure: null }
        : {
            bytes: 0,
            isComplete: false,
            failure: say('phone.platform.thePhonesHeldFiles.theFileArrivedIncomplete'),
          };
    },

    stop: async (name) => {
      const transfer = transfers.get(name);

      transfers.delete(name);
      await transfer?.pauseAsync().catch(() => undefined);
    },

    drop: async (name) => {
      await deleteAsync(pathOf(name), { idempotent: true }).catch(() => undefined);
    },

    has: async (name) => (await getInfoAsync(pathOf(name)).catch(() => ({ exists: false }))).exists,

    addressOf: pathOf,

    canPlay: canThisPhonePlay,
  };
};

export { thePhonesListeningFiles };
