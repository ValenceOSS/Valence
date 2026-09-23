import { renderHook, waitFor } from '@testing-library/react-native';
import { fetchMediaDetail } from '@ValenceClient/library/fetchLibrary';
import { fetchShows } from '@ValenceClient/library/fetchShows';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { useTheProgrammeOfEpisode } from './useTheProgrammeOfEpisode';

jest.mock('@ValenceClient/library/fetchLibrary');
jest.mock('@ValenceClient/library/fetchShows');

const SEVERANCE = {
  id: 'severance',
  libraryId: 'shows',
  title: 'Severance',
  seasonCount: 2,
  episodeCount: 19,
  latestAddedAt: '2026-01-01T00:00:00.000Z',
  coverMediaId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  seriesId: 'severance-series',
  year: 2022,
};

describe('useTheProgrammeOfEpisode', () => {
  it('finds the programme an episode belongs to', async () => {
    jest.mocked(fetchMediaDetail).mockResolvedValue(
      MediaDetailSchema.parse({
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa1',
        libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
        title: 'Good News About Hell',
        year: 2022,
        container: 'mkv',
        durationSeconds: 3300,
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
        metadata: {
          seriesTitle: 'Severance',
          hasPoster: false,
          hasBackdrop: false,
          hasLogo: false,
        },
      }),
    );
    jest.mocked(fetchShows).mockResolvedValue([SEVERANCE]);

    const { result } = await renderHook(() => useTheProgrammeOfEpisode('episode'), {
      wrapper: CacheScope,
    });

    await waitFor(() => {
      expect(result.current?.id).toBe('severance');
    });
  });
});
