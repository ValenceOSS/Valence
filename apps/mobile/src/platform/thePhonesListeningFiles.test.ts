import {
  createDownloadResumable,
  deleteAsync,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';
import { AppState } from 'react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { canThisPhonePlay } from '@ValenceMobile/music/canThisPhonePlay';
import { theCookiesThisPhoneHolds } from '@ValenceMobile/platform/theCookiesThisPhoneHolds';
import { thePhonesListeningFiles } from './thePhonesListeningFiles';
import type { AppStateStatus } from 'react-native';

type Progress = { totalBytesWritten: number; totalBytesExpectedToWrite: number };

type Finished = { status: number } | undefined;

let mockFinishings: ((heard: (progress: Progress) => void) => Promise<Finished>)[] = [];

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///phone/',
  createDownloadResumable: jest.fn(
    (_from: string, _to: string, _options: object, heard: (progress: Progress) => void) => {
      let stop: (done: Finished) => void = () => undefined;
      const stopped = new Promise<Finished>((resolve) => {
        stop = resolve;
      });

      return {
        downloadAsync: () =>
          Promise.race([
            (mockFinishings.shift() ?? (() => Promise.resolve({ status: 200 })))(heard),
            stopped,
          ]),
        pauseAsync: () => {
          stop(undefined);

          return Promise.resolve({ resumeData: 'partway' });
        },
      };
    },
  ),
  deleteAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 11 })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
}));

let hearing = jest.spyOn(AppState, 'addEventListener');

const SONG = 'track-t1-high.m4a';

const FROM = '/api/music/tracks/t1/stream';

/**
 * Lets what is under way get as far as it can.
 *
 * @returns Once it has.
 */
const aMoment = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

/**
 * Tells everything listening that the app has moved to or from the front.
 *
 * @param state - Where the app is now.
 */
const theAppGoes = (state: AppStateStatus): void => {
  for (const [, listener] of hearing.mock.calls) {
    listener(state);
  }
};

/**
 * A fetch the phone breaks off once the app has gone to the background.
 *
 * @returns It, failing.
 */
const brokenOffInTheBackground = (): Promise<Finished> => {
  theAppGoes('background');

  return Promise.reject(new Error('the phone broke it off'));
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFinishings = [];
  hearing = jest.spyOn(AppState, 'addEventListener');
  Object.assign(AppState, { currentState: 'background' });
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
});

describe('thePhonesListeningFiles', () => {
  it('fetches a song into its own folder with the phone’s session, saying how far it has got', async () => {
    jest.mocked(theCookiesThisPhoneHolds).mockResolvedValueOnce('session=abc');
    mockFinishings = [
      (heard) => {
        heard({ totalBytesWritten: 5, totalBytesExpectedToWrite: 11 });
        heard({ totalBytesWritten: 7, totalBytesExpectedToWrite: 0 });

        return Promise.resolve({ status: 200 });
      },
    ];
    const report = jest.fn();

    const fetched = await thePhonesListeningFiles().fetch(FROM, SONG, report);

    expect(fetched).toEqual({ bytes: 11, isComplete: true, failure: null });
    expect(makeDirectoryAsync).toHaveBeenCalledWith('file:///phone/listening/', {
      intermediates: true,
    });
    expect(createDownloadResumable).toHaveBeenCalledWith(
      `http://one.local:8420${FROM}`,
      `file:///phone/listening/${SONG}`,
      { headers: { Cookie: 'session=abc' } },
      expect.any(Function),
    );
    expect(report.mock.calls).toEqual([
      [5, 11],
      [7, null],
    ]);
  });

  it('sends no session where the phone holds none', async () => {
    await thePhonesListeningFiles().fetch(FROM, SONG, jest.fn());

    expect(jest.mocked(createDownloadResumable).mock.calls[0]?.[2]).toEqual({});
  });

  it('takes away a file the server would not give, and says so', async () => {
    mockFinishings = [() => Promise.resolve({ status: 404 })];

    const fetched = await thePhonesListeningFiles().fetch(FROM, SONG, jest.fn());

    expect(fetched).toEqual({
      bytes: 0,
      isComplete: false,
      failure: 'Couldn’t download the file from the server.',
    });
    expect(deleteAsync).toHaveBeenCalledWith(`file:///phone/listening/${SONG}`, {
      idempotent: true,
    });
  });

  it('says a file that did not arrive could not be fetched, where the app never left', async () => {
    mockFinishings = [() => Promise.reject(new Error('the network went'))];

    const fetched = await thePhonesListeningFiles().fetch(FROM, SONG, jest.fn());

    expect(fetched.failure).toBe('Couldn’t download the file from the server.');
    expect(createDownloadResumable).toHaveBeenCalledTimes(1);
  });

  it('says a file that is not on the phone once fetched arrived incomplete', async () => {
    jest.mocked(getInfoAsync).mockResolvedValueOnce({ exists: false, isDirectory: false, uri: '' });

    const fetched = await thePhonesListeningFiles().fetch(FROM, SONG, jest.fn());

    expect(fetched).toEqual({
      bytes: 0,
      isComplete: false,
      failure: 'The download is incomplete.',
    });
  });

  it('stops a fetch partway, with no failure and nothing left of it on the phone', async () => {
    mockFinishings = [() => new Promise<Finished>(() => undefined)];
    const files = thePhonesListeningFiles();
    const fetching = files.fetch(FROM, SONG, jest.fn());

    await aMoment();
    await files.stop(SONG);

    await expect(fetching).resolves.toEqual({ bytes: 0, isComplete: false, failure: null });
    expect(deleteAsync).toHaveBeenCalledWith(`file:///phone/listening/${SONG}`, {
      idempotent: true,
    });
  });

  it('tries a fetch again once the app is back, where the phone broke it off while it was away', async () => {
    mockFinishings = [brokenOffInTheBackground];
    const fetching = thePhonesListeningFiles().fetch(FROM, SONG, jest.fn());

    await aMoment();

    expect(createDownloadResumable).toHaveBeenCalledTimes(1);

    theAppGoes('active');

    await expect(fetching).resolves.toEqual({ bytes: 11, isComplete: true, failure: null });
    expect(createDownloadResumable).toHaveBeenCalledTimes(2);
  });

  it('gives up after trying three more times, without waiting for the app to come back again', async () => {
    mockFinishings = [
      brokenOffInTheBackground,
      brokenOffInTheBackground,
      brokenOffInTheBackground,
      brokenOffInTheBackground,
    ];
    const fetching = thePhonesListeningFiles().fetch(FROM, SONG, jest.fn());

    for (let time = 0; time < 3; time += 1) {
      await aMoment();
      theAppGoes('active');
    }

    await expect(fetching).resolves.toMatchObject({
      isComplete: false,
      failure: 'Couldn’t download the file from the server.',
    });
    expect(createDownloadResumable).toHaveBeenCalledTimes(4);
  });

  it('takes a file off the phone', async () => {
    await thePhonesListeningFiles().drop(SONG);

    expect(deleteAsync).toHaveBeenCalledWith(`file:///phone/listening/${SONG}`, {
      idempotent: true,
    });
  });

  it('says whether a file is on the phone', async () => {
    const files = thePhonesListeningFiles();

    await expect(files.has(SONG)).resolves.toBe(true);
    expect(getInfoAsync).toHaveBeenCalledWith(`file:///phone/listening/${SONG}`);

    jest.mocked(getInfoAsync).mockResolvedValueOnce({ exists: false, isDirectory: false, uri: '' });

    await expect(files.has(SONG)).resolves.toBe(false);

    jest.mocked(getInfoAsync).mockRejectedValueOnce(new Error('no such folder'));

    await expect(files.has(SONG)).resolves.toBe(false);
  });

  it('says where a kept file is, and plays what the phone plays', () => {
    const files = thePhonesListeningFiles();

    expect(files.addressOf(SONG)).toBe(`file:///phone/listening/${SONG}`);
    expect(files.canPlay).toBe(canThisPhonePlay);
  });
});
