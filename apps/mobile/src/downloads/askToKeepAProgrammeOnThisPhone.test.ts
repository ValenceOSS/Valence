import { askForSeries, fetchSeriesDownloadOffer } from '@ValenceClient/downloads/fetchDownloads';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { DownloadSchema } from '@ValenceContracts/schemas/Download';
import { chooseADownloadQuality } from '@ValenceMobile/downloads/chooseADownloadQuality';
import { askToKeepAProgrammeOnThisPhone } from './askToKeepAProgrammeOnThisPhone';

jest.mock('@ValenceClient/downloads/fetchDownloads');
jest.mock('@ValenceMobile/downloads/chooseADownloadQuality');

const OFFER = {
  mediaId: 'severance',
  title: 'Severance',
  episodes: 2,
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

const anEpisode = (id: string) =>
  DownloadSchema.parse({
    id,
    mediaId: '00000000-0000-4000-8000-000000000009',
    seriesId: 'severance',
    seriesTitle: 'Severance',
    title: 'An episode',
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
  jest.mocked(fetchSeriesDownloadOffer).mockResolvedValue(OFFER);
  jest.mocked(chooseADownloadQuality).mockResolvedValue('original');
});

describe('askToKeepAProgrammeOnThisPhone', () => {
  it('asks for just the episodes chosen', async () => {
    const one = anEpisode('00000000-0000-4000-8000-000000000001');
    const two = anEpisode('00000000-0000-4000-8000-000000000002');

    jest.mocked(askForSeries).mockResolvedValue([one, two]);

    await expect(
      askToKeepAProgrammeOnThisPhone('severance', 'Severance', ['e1', 'e2']),
    ).resolves.toBe(true);
    expect(askForSeries).toHaveBeenCalledWith('severance', 'original', [], ['e1', 'e2']);
    expect(chooseADownloadQuality).toHaveBeenCalledWith(OFFER, 'Download Severance', '2 episodes');
  });

  it('asks for nothing where no episodes were chosen', async () => {
    await expect(askToKeepAProgrammeOnThisPhone('severance', 'Severance', [])).resolves.toBe(false);
    expect(fetchSeriesDownloadOffer).not.toHaveBeenCalled();
  });
});
