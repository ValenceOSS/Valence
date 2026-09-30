import {
  createDownloadResumable,
  deleteAsync,
  downloadAsync,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
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
  readAsStringAsync: jest.fn(() => Promise.reject(new Error('not kept'))),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@ValenceMobile/platform/theCookiesThisPhoneHolds', () => ({
  theCookiesThisPhoneHolds: jest.fn(() => Promise.resolve(null)),
}));

const INDEX_URL = '/api/playback/trickplay/t1/thumbnails.vtt';

const VTT = 'WEBVTT\n\n00:00:00.000 --> 00:00:10.000\nsheet-001.jpg#xywh=0,0,320,180\n';

/**
 * A server whose thumbnails are made, or not yet.
 *
 * @param isMade - Whether it has made them.
 */
const aServerWhoseThumbnails = (isMade: boolean) => {
  jest.spyOn(global, 'fetch').mockImplementation((asked) => {
    const address = typeof asked === 'string' ? asked : 'url' in asked ? asked.url : asked.href;

    return Promise.resolve(
      !isMade
        ? new Response('not yet', { status: 404 })
        : address.endsWith('/trickplay')
          ? new Response(JSON.stringify({ id: 't1', url: INDEX_URL }))
          : new Response(VTT),
    );
  });
};

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
  aServerWhoseThumbnails(false);
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
    expect(deleteAsync).toHaveBeenCalledWith(
      `file:///phone/held/${ARRIVAL.downloadId}.trickplay/`,
      { idempotent: true },
    );
  });

  it('keeps the thumbnails beside a film, for scrubbing without the server', async () => {
    aServerWhoseThumbnails(true);
    const held = thePhonesHeldFiles(aFakePlatform().store);

    await held.keep(ARRIVAL);

    const [row] = await held.all();
    const kept = `file:///phone/held/${ARRIVAL.downloadId}.trickplay/`;

    expect(row?.hasTrickplay).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      `http://one.local:8420/api/playback/${ARRIVAL.mediaId}/trickplay`,
      { method: 'POST' },
    );
    expect(writeAsStringAsync).toHaveBeenCalledWith(`${kept}thumbnails.vtt`, VTT);
    expect(downloadAsync).toHaveBeenCalledWith(
      'http://one.local:8420/api/playback/trickplay/t1/sheet-001.jpg',
      `${kept}sheet-001.jpg`,
      {},
    );
  });

  it('keeps a film while the server has not made its thumbnails yet', async () => {
    const held = thePhonesHeldFiles(aFakePlatform().store);

    await held.keep(ARRIVAL);

    const [row] = await held.all();

    expect([row?.state, row?.hasTrickplay]).toEqual(['here', false]);
  });

  it('keeps no thumbnails at all where a sheet did not come', async () => {
    aServerWhoseThumbnails(true);
    jest
      .mocked(downloadAsync)
      .mockResolvedValueOnce({ status: 200, uri: '', headers: {}, mimeType: null })
      .mockResolvedValueOnce({ status: 404, uri: '', headers: {}, mimeType: null });
    const held = thePhonesHeldFiles(aFakePlatform().store);

    await held.keep(ARRIVAL);

    const [row] = await held.all();

    expect(row?.hasTrickplay).toBe(false);
    expect(deleteAsync).toHaveBeenCalledWith(
      `file:///phone/held/${ARRIVAL.downloadId}.trickplay/`,
      { idempotent: true },
    );
  });

  it('keeps no thumbnails for a film forgotten while they were being fetched', async () => {
    aServerWhoseThumbnails(true);
    const held = thePhonesHeldFiles(aFakePlatform().store);

    jest
      .mocked(downloadAsync)
      .mockResolvedValueOnce({ status: 200, uri: '', headers: {}, mimeType: null })
      .mockImplementationOnce(async () => {
        await held.drop(ARRIVAL.downloadId);

        return { status: 200, uri: '', headers: {}, mimeType: null };
      });

    await held.keep(ARRIVAL);

    const folder = `file:///phone/held/${ARRIVAL.downloadId}.trickplay/`;

    expect(await held.all()).toEqual([]);
    expect(jest.mocked(deleteAsync).mock.calls.filter(([what]) => what === folder)).toHaveLength(2);
  });

  it('asks again for thumbnails a film came without, once the app has settled', async () => {
    const store = aFakePlatform().store;

    await thePhonesHeldFiles(store).keep(ARRIVAL);

    aServerWhoseThumbnails(true);

    const settle: (() => void)[] = [];
    const held = thePhonesHeldFiles(store, undefined, (run) => {
      settle.push(run);
    });

    settle.forEach((run) => {
      run();
    });

    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    const [row] = await held.all();

    expect(row?.hasTrickplay).toBe(true);
  });

  it('reads the thumbnails it kept, with each sheet found beside them', async () => {
    jest.mocked(readAsStringAsync).mockResolvedValueOnce(VTT);
    const held = thePhonesHeldFiles(aFakePlatform().store);

    const kept = await held.trickplayFor(ARRIVAL.downloadId);

    expect(kept?.thumbnails[0]?.sheetUrl).toBe(
      `file:///phone/held/${ARRIVAL.downloadId}.trickplay/sheet-001.jpg`,
    );
  });

  it('finds no thumbnails where none were kept', async () => {
    await expect(
      thePhonesHeldFiles(aFakePlatform().store).trickplayFor(ARRIVAL.downloadId),
    ).resolves.toBeNull();
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
            hasTrickplay: false,
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
