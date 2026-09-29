import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchMediaDetail } from '@ValenceClient/library/fetchLibrary';
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { AMediaBlock } from './AMediaBlock';

jest.mock('@ValenceClient/library/fetchLibrary', () => ({
  ...jest.requireActual<object>('@ValenceClient/library/fetchLibrary'),
  fetchMediaDetail: jest.fn(),
}));

const MEDIA = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'https://valence.test' }));
});

describe('AMediaBlock', () => {
  it('draws the title from the library’s own record and opens it', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(
      MediaDetailSchema.parse({
        id: MEDIA,
        libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
        title: 'Arrival',
        year: 2016,
        container: 'mkv',
        durationSeconds: 6960,
        videoCodec: 'hevc',
        videoRange: 'SDR',
        width: 3840,
        height: 2160,
        bitrateKbps: 12000,
        audioStreams: [
          {
            index: 1,
            codec: 'eac3',
            channels: 6,
            language: 'eng',
            isDefault: true,
            isAtmos: false,
          },
        ],
        subtitleStreams: [],
        addedAt: '2026-01-01T00:00:00.000Z',
        metadata: { hasPoster: true, hasBackdrop: false, hasLogo: false },
      }),
    );
    const onLookAt = jest.fn();
    const drawn = await render(<AMediaBlock mediaId={MEDIA} onLookAt={onLookAt} />, {
      wrapper: CacheScope,
    });

    await userEvent.press(await drawn.findByLabelText('Arrival'));

    expect(onLookAt).toHaveBeenCalledWith(MEDIA);
  });

  it('draws nothing for a title the library does not have', async () => {
    jest.mocked(fetchMediaDetail).mockRejectedValue(new Error('Missing'));
    const drawn = await render(<AMediaBlock mediaId={MEDIA} />, { wrapper: CacheScope });

    expect(drawn.toJSON()).toBeNull();
  });
});
