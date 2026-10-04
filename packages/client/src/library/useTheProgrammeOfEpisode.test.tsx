import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { MediaDetailSchema } from '@ValenceContracts/schemas/Library';
import { useTheProgrammeOfEpisode } from './useTheProgrammeOfEpisode';

const { detailMock, showsMock } = vi.hoisted(() => ({
  detailMock: vi.fn(),
  showsMock: vi.fn(),
}));

vi.mock('@ValenceClient/library/fetchLibrary', () => ({ fetchMediaDetail: detailMock }));
vi.mock('@ValenceClient/library/fetchShows', () => ({ fetchShows: showsMock }));

const PROGRAMME = {
  id: 'a-show',
  libraryId: 'shows',
  title: 'A Show',
  seasonCount: 2,
  episodeCount: 19,
  latestAddedAt: '2026-01-01T00:00:00.000Z',
  coverMediaId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  seriesId: 'a-show-series',
  year: 2022,
};

const anEpisodeOf = (seriesTitle: string | undefined) =>
  MediaDetailSchema.parse({
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa1',
    libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
    title: 'An Episode',
    year: 2022,
    container: 'mkv',
    durationSeconds: 3300,
    videoCodec: 'hevc',
    videoRange: 'SDR',
    width: 3840,
    height: 2160,
    bitrateKbps: 12000,
    audioStreams: [
      { index: 1, codec: 'eac3', channels: 6, language: 'eng', isDefault: true, isAtmos: false },
    ],
    subtitleStreams: [],
    addedAt: '2026-01-01T00:00:00.000Z',
    metadata: { seriesTitle, hasPoster: false, hasBackdrop: false, hasLogo: false },
  });

beforeEach(() => {
  detailMock.mockReset();
  showsMock.mockReset();
});

describe('useTheProgrammeOfEpisode', () => {
  it('finds the programme an episode belongs to by its series name', async () => {
    detailMock.mockResolvedValue(anEpisodeOf('A Show'));
    showsMock.mockResolvedValue([PROGRAMME]);

    const { result } = renderHook(() => useTheProgrammeOfEpisode('episode'), {
      wrapper: CacheScope,
    });

    await waitFor(() => {
      expect(result.current?.id).toBe('a-show');
    });
  });

  it('finds nothing for a film', async () => {
    detailMock.mockResolvedValue(anEpisodeOf(undefined));
    showsMock.mockResolvedValue([PROGRAMME]);

    const { result } = renderHook(() => useTheProgrammeOfEpisode('film'), { wrapper: CacheScope });

    await waitFor(() => {
      expect(detailMock).toHaveBeenCalled();
    });

    expect(result.current).toBeNull();
    expect(showsMock).not.toHaveBeenCalled();
  });
});
