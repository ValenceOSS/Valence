import { askForDownload, fetchDownloadOffer } from '@ValenceClient/downloads/fetchDownloads';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { DownloadSchema } from '@ValenceContracts/schemas/Download';
import { askedOnThisPhone } from '@ValenceMobile/downloads/askedOnThisPhone';
import { chooseADownloadQuality } from '@ValenceMobile/downloads/chooseADownloadQuality';
import { askToKeepOnThisPhone } from './askToKeepOnThisPhone';

jest.mock('@ValenceClient/downloads/fetchDownloads');
jest.mock('@ValenceMobile/downloads/chooseADownloadQuality');

const OFFER = {
  mediaId: 'arrival',
  title: 'Arrival',
  episodes: 1,
  options: [
    {
      quality: 'original' as const,
      label: 'Original',
      meaning: 'As it is',
      bytes: null,
      comparison: null,
      wouldTranscode: false,
    },
  ],
};

const ASKED = DownloadSchema.parse({
  id: '00000000-0000-4000-8000-000000000001',
  mediaId: '00000000-0000-4000-8000-000000000002',
  seriesId: null,
  seriesTitle: null,
  title: 'Arrival',
  quality: 'original',
  audioLanguages: [],
  state: 'preparing',
  progress: 0,
  bytesPerSecond: null,
  sizeBytes: null,
  failure: null,
  askedAt: '2026-09-23T10:00:00.000Z',
  readyAt: null,
});

beforeEach(() => {
  jest.clearAllMocks();
  installPlatform(aFakePlatform());
  jest.mocked(fetchDownloadOffer).mockResolvedValue(OFFER);
  jest.mocked(askForDownload).mockResolvedValue(ASKED);
});

describe('askToKeepOnThisPhone', () => {
  it('asks the server for the quality picked, and remembers this phone asked', async () => {
    jest.mocked(chooseADownloadQuality).mockResolvedValue('original');

    await expect(askToKeepOnThisPhone('arrival', 'Arrival')).resolves.toBe(true);
    expect(askForDownload).toHaveBeenCalledWith('arrival', 'original');
    expect(askedOnThisPhone()).toEqual([ASKED.id]);
  });

  it('asks for nothing when somebody cancels', async () => {
    jest.mocked(chooseADownloadQuality).mockResolvedValue(null);

    await expect(askToKeepOnThisPhone('arrival', 'Arrival')).resolves.toBe(false);
    expect(askForDownload).not.toHaveBeenCalled();
  });

  it('asks for nothing where the server offers no way to keep it', async () => {
    jest.mocked(fetchDownloadOffer).mockResolvedValue(null);

    await expect(askToKeepOnThisPhone('arrival', 'Arrival')).resolves.toBe(false);
  });
});
