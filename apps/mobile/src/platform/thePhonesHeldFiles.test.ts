import {
  createDownloadResumable,
  deleteAsync,
  downloadAsync,
  getInfoAsync,
} from 'expo-file-system/legacy';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { thePhonesHeldFiles } from './thePhonesHeldFiles';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

type Progress = { totalBytesWritten: number; totalBytesExpectedToWrite: number };

let mockHeard: ((progress: Progress) => void) | null = null;

let mockFinishing: Promise<{ status: number }> | null = null;

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///phone/',
  createDownloadResumable: jest.fn(
    (_from: string, _to: string, _options: object, heard?: (progress: Progress) => void) => {
      mockHeard = heard ?? null;

      return {
        downloadAsync: () => mockFinishing ?? Promise.resolve({ status: 200 }),
        resumeAsync: () => Promise.resolve({ status: 206 }),
        pauseAsync: () => Promise.resolve({ resumeData: 'resume' }),
      };
    },
  ),
  deleteAsync: jest.fn(() => Promise.resolve()),
  downloadAsync: jest.fn(() => Promise.resolve({ status: 200 })),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 11 })),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
}));

const ARRIVAL = {
  downloadId: '00000000-0000-4000-8000-000000000001',
  mediaId: '00000000-0000-4000-8000-000000000002',
  seriesId: null,
  seriesTitle: null,
  title: 'Arrival',
  quality: 'original' as const,
  durationSeconds: 6960,
  ofBytes: null,
};

const aStoreThatCounts = (): DeviceStore & { writes: string[] } => {
  const kept = new Map<string, string>();
  const writes: string[] = [];

  return {
    writes,
    read: (key) => kept.get(key) ?? null,
    write: (key, value) => {
      writes.push(key);
      kept.set(key, value);
    },
    forget: (key) => {
      kept.delete(key);
    },
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
});

describe('thePhonesHeldFiles', () => {
  it('keeps a film on the phone, fetching it and then its poster', async () => {
    const store = aFakePlatform().store;
    const held = thePhonesHeldFiles(store);

    await held.keep(ARRIVAL);

    const [row] = await held.all();

    expect(row).toMatchObject({ downloadId: ARRIVAL.downloadId, state: 'here', hasPoster: true });
    expect(downloadAsync).toHaveBeenCalledWith(
      `http://one.local:8420/api/media/${ARRIVAL.mediaId}/image/poster`,
      held.posterFor(ARRIVAL.downloadId),
      {},
    );
  });

  it('refuses a film that arrived shorter than the server said it was', async () => {
    const held = thePhonesHeldFiles(aFakePlatform().store);

    await held.keep({ ...ARRIVAL, ofBytes: 4_000 });

    expect((await held.all())[0]).toMatchObject({
      state: 'failed',
      failure: 'The file arrived incomplete.',
    });
  });

  it('remembers what it holds between launches', async () => {
    const store = aFakePlatform().store;

    await thePhonesHeldFiles(store).keep(ARRIVAL);

    expect(await thePhonesHeldFiles(store).all()).toHaveLength(1);
  });

  it('forgets a film whose file has gone', async () => {
    const store = aFakePlatform().store;
    const held = thePhonesHeldFiles(store);

    await held.keep(ARRIVAL);
    jest.mocked(getInfoAsync).mockResolvedValueOnce({ exists: false, isDirectory: false, uri: '' });

    expect(await held.all()).toEqual([]);
  });

  it('drops a film and its poster from the phone', async () => {
    const store = aFakePlatform().store;
    const held = thePhonesHeldFiles(store);

    await held.keep(ARRIVAL);
    await held.drop(ARRIVAL.downloadId);

    expect(await held.all()).toEqual([]);
    expect(deleteAsync).toHaveBeenCalledWith(held.sourceFor(ARRIVAL.downloadId), {
      idempotent: true,
    });
  });

  it('writes down how far a fetch has got at most once a second, and every change of state', async () => {
    const store = aStoreThatCounts();
    let finish: (done: { status: number }) => void = () => undefined;

    mockFinishing = new Promise((resolve) => {
      finish = resolve;
    });

    const held = thePhonesHeldFiles(store);
    const keeping = held.keep(ARRIVAL);

    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    const before = store.writes.length;

    mockHeard?.({ totalBytesWritten: 10, totalBytesExpectedToWrite: 100 });
    mockHeard?.({ totalBytesWritten: 20, totalBytesExpectedToWrite: 100 });
    mockHeard?.({ totalBytesWritten: 30, totalBytesExpectedToWrite: 100 });

    expect(store.writes.length - before).toBeLessThanOrEqual(1);

    jest.mocked(getInfoAsync).mockResolvedValueOnce({
      exists: true,

      size: 100,

      isDirectory: false,

      uri: '',

      modificationTime: 0,
    });

    finish({ status: 200 });
    await keeping;
    mockFinishing = null;

    const [row] = await held.all();

    expect(row).toMatchObject({ state: 'here', bytes: 30 });
  });

  it('picks up what was left fetching once the app has settled, from what it left aside', async () => {
    const store = aStoreThatCounts();

    store.write(
      'valence.held',
      JSON.stringify({
        held: [
          {
            ...ARRIVAL,
            state: 'fetching',
            bytes: 5,
            bytesPerSecond: null,
            failure: null,
            keptAt: '2026-09-24T00:00:00.000Z',
            hasPoster: false,
          },
        ],
      }),
    );

    const settle: (() => void)[] = [];
    const readAside = jest.fn(() => Promise.resolve('left'));

    thePhonesHeldFiles(store, readAside, (run) => {
      settle.push(run);
    });

    expect(createDownloadResumable).not.toHaveBeenCalled();

    settle.forEach((run) => {
      run();
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(readAside).toHaveBeenCalledWith(`valence.held.resume.${ARRIVAL.downloadId}`);
    expect(createDownloadResumable).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      {},
      expect.any(Function),
      'left',
    );
  });
});
