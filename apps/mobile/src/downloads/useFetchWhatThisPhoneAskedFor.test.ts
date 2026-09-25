import { renderHook, waitFor } from '@testing-library/react-native';
import { fetchDownloads } from '@ValenceClient/downloads/fetchDownloads';
import { keepAFile } from '@ValenceClient/downloads/keepingFiles';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { DownloadSchema } from '@ValenceContracts/schemas/Download';
import { askedOnThisPhone } from '@ValenceMobile/downloads/askedOnThisPhone';
import { rememberAskedOnThisPhone } from '@ValenceMobile/downloads/rememberAskedOnThisPhone';
import { useFetchWhatThisPhoneAskedFor } from './useFetchWhatThisPhoneAskedFor';

jest.mock('@ValenceClient/downloads/fetchDownloads');
jest.mock('@ValenceClient/downloads/keepingFiles');
jest.mock('@ValenceClient/downloads/useHeldFiles', () => ({ useHeldFiles: () => [] }));

const READY = DownloadSchema.parse({
  id: '00000000-0000-4000-8000-000000000001',
  mediaId: '00000000-0000-4000-8000-000000000002',
  seriesId: null,
  seriesTitle: null,
  title: 'Arrival',
  quality: 'original',
  audioLanguages: [],
  state: 'ready',
  progress: 1,
  bytesPerSecond: null,
  sizeBytes: 4_000_000_000,
  failure: null,
  askedAt: '2026-09-23T10:00:00.000Z',
  readyAt: '2026-09-23T10:30:00.000Z',
});

beforeEach(() => {
  jest.clearAllMocks();
  installPlatform(aFakePlatform());
});

describe('useFetchWhatThisPhoneAskedFor', () => {
  it('fetches a download this phone asked for once the server has it ready', async () => {
    jest.mocked(fetchDownloads).mockResolvedValue([READY]);
    rememberAskedOnThisPhone(READY.id, true);

    await renderHook(
      () => {
        useFetchWhatThisPhoneAskedFor();
      },
      { wrapper: CacheScope },
    );

    await waitFor(() => {
      expect(keepAFile).toHaveBeenCalledWith(READY);
    });
    expect(askedOnThisPhone()).toEqual([]);
  });

  it('leaves alone what another device asked for', async () => {
    jest.mocked(fetchDownloads).mockResolvedValue([READY]);

    await renderHook(
      () => {
        useFetchWhatThisPhoneAskedFor();
      },
      { wrapper: CacheScope },
    );

    expect(keepAFile).not.toHaveBeenCalled();
  });
});
