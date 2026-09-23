import { deleteAsync, downloadAsync, getInfoAsync } from 'expo-file-system/legacy';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { thePhonesHeldFiles } from './thePhonesHeldFiles';

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///phone/',
  createDownloadResumable: jest.fn(() => ({
    downloadAsync: () => Promise.resolve({ status: 200 }),
    resumeAsync: () => Promise.resolve({ status: 206 }),
    pauseAsync: () => Promise.resolve({ resumeData: 'resume' }),
  })),
  deleteAsync: jest.fn(() => Promise.resolve()),
  downloadAsync: jest.fn(() => Promise.resolve({ status: 200 })),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true })),
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
});
