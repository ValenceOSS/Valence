import { fireEvent, render } from '@testing-library/react-native';
import { aFakeHeldFiles } from '@ValenceClient/testing/aFakeHeldFiles';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchDownloads } from '@ValenceClient/downloads/fetchDownloads';
import { TheDownloads } from './TheDownloads';

jest.mock('@ValenceClient/downloads/fetchDownloads', () => ({
  ...jest.requireActual<object>('@ValenceClient/downloads/fetchDownloads'),
  fetchDownloads: jest.fn(),
}));

describe('TheDownloads', () => {
  it('says so where nothing has been downloaded', async () => {
    installPlatform(aFakePlatform());
    jest.mocked(fetchDownloads).mockResolvedValue([]);
    const drawn = await render(<TheDownloads onWatch={jest.fn()} />, { wrapper: CacheScope });

    expect(drawn.getByText('Downloads')).toBeTruthy();
    expect(await drawn.findByText('Nothing downloaded yet')).toBeTruthy();
  });

  it('offers to try a failed download again, carrying on from where it got to', async () => {
    const files = aFakeHeldFiles([
      {
        downloadId: '00000000-0000-4000-8000-000000000001',
        mediaId: '00000000-0000-4000-8000-000000000002',
        seriesId: null,
        seriesTitle: null,
        title: 'Arrival',
        quality: 'original',
        durationSeconds: 6960,
        ofBytes: 4_000_000_000,
        state: 'failed',
        bytes: 1_000_000_000,
        bytesPerSecond: null,
        failure: 'The file couldn’t be fetched.',
        keptAt: '2026-10-01T00:00:00.000Z',
        hasPoster: false,
        hasTrickplay: false,
      },
    ]);

    installPlatform(aFakePlatform({ held: files.held }));
    jest.mocked(fetchDownloads).mockResolvedValue([]);
    const drawn = await render(<TheDownloads onWatch={jest.fn()} />, { wrapper: CacheScope });

    await fireEvent.press(await drawn.findByLabelText('Try downloading Arrival again'));

    expect(files.paused).toEqual([['00000000-0000-4000-8000-000000000001', false]]);
  });
});
