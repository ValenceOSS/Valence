import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchShow } from '@ValenceClient/library/fetchShows';
import { fetchWatchProgress } from '@ValenceClient/playback/watchProgress';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import { ShowDetailSchema } from '@ValenceContracts/schemas/Show';
import { AShow } from './AShow';
import type { ReactNode } from 'react';

jest.mock('@ValenceClient/library/fetchShows');
jest.mock('@ValenceClient/playback/watchProgress', () => ({
  ...jest.requireActual<object>('@ValenceClient/playback/watchProgress'),
  fetchWatchProgress: jest.fn(),
}));

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const anEpisode = (id: string, title: string, seasonNumber: number, episodeNumber: number) =>
  MediaSummarySchema.parse({
    id,
    libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
    title,
    year: null,
    durationSeconds: 2640,
    width: 1920,
    height: 1080,
    videoCodec: 'hevc',
    videoRange: 'SDR',
    addedAt: '2026-01-01T00:00:00.000Z',
    seasonNumber,
    episodeNumber,
  });

const PILOT = '3fa85f64-5717-4562-b3fc-2c963f66af11';
const LATER = '3fa85f64-5717-4562-b3fc-2c963f66af21';

const aShow = (seasons: { seasonNumber: number; episodes: ReturnType<typeof anEpisode>[] }[]) =>
  ShowDetailSchema.parse({
    id: 'severance',
    libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
    title: 'Severance',
    seasonCount: seasons.length,
    episodeCount: seasons.reduce((sum, season) => sum + season.episodes.length, 0),
    latestAddedAt: '2026-01-01T00:00:00.000Z',
    coverMediaId: PILOT,
    year: 2022,
    seasons,
  });

const TWO_SEASONS = aShow([
  { seasonNumber: 1, episodes: [anEpisode(PILOT, 'Good News About Hell', 1, 1)] },
  { seasonNumber: 2, episodes: [anEpisode(LATER, 'Hello, Ms. Cobel', 2, 1)] },
]);

beforeEach(() => {
  jest.mocked(fetchShow).mockReset();
  jest.mocked(fetchWatchProgress).mockReset().mockResolvedValue([]);
});

describe('AShow', () => {
  it('names the programme', async () => {
    jest.mocked(fetchShow).mockResolvedValue(TWO_SEASONS);

    const drawn = await render(
      around(
        <AShow
          libraryId="l"
          showId="s"
          onWatch={jest.fn()}
          onLookAt={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getAllByText('Severance').length).toBeGreaterThan(0);
    });
  });

  it('offers its seasons where there is more than one', async () => {
    jest.mocked(fetchShow).mockResolvedValue(TWO_SEASONS);

    const drawn = await render(
      around(
        <AShow
          libraryId="l"
          showId="s"
          onWatch={jest.fn()}
          onLookAt={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByText('Season 2')).toBeTruthy();
    });
  });

  it('offers no choice of season for a programme with only one', async () => {
    jest
      .mocked(fetchShow)
      .mockResolvedValue(
        aShow([{ seasonNumber: 1, episodes: [anEpisode(PILOT, 'Good News About Hell', 1, 1)] }]),
      );

    const drawn = await render(
      around(
        <AShow
          libraryId="l"
          showId="s"
          onWatch={jest.fn()}
          onLookAt={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByText('Good News About Hell')).toBeTruthy();
    });

    expect(drawn.queryByText('Season 1')).toBeNull();
  });

  it('opens on the season somebody is up to', async () => {
    jest.mocked(fetchShow).mockResolvedValue(TWO_SEASONS);
    jest.mocked(fetchWatchProgress).mockResolvedValue([
      {
        mediaId: PILOT,
        positionSeconds: 2640,
        durationSeconds: 2640,
        isFinished: true,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const drawn = await render(
      around(
        <AShow
          libraryId="l"
          showId="s"
          onWatch={jest.fn()}
          onLookAt={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByText('Hello, Ms. Cobel')).toBeTruthy();
    });
  });

  it('shows another season when it is chosen', async () => {
    jest.mocked(fetchShow).mockResolvedValue(TWO_SEASONS);

    const drawn = await render(
      around(
        <AShow
          libraryId="l"
          showId="s"
          onWatch={jest.fn()}
          onLookAt={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText('Season 2')).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText('Season 2'));

    expect(drawn.getByText('Hello, Ms. Cobel')).toBeTruthy();
  });

  it('plays an episode from where they left it', async () => {
    jest.mocked(fetchShow).mockResolvedValue(TWO_SEASONS);
    jest.mocked(fetchWatchProgress).mockResolvedValue([
      {
        mediaId: PILOT,
        positionSeconds: 900,
        durationSeconds: 2640,
        isFinished: false,
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const onWatch = jest.fn();
    const drawn = await render(
      around(
        <AShow
          libraryId="l"
          showId="s"
          onWatch={onWatch}
          onLookAt={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText(/^(Play|Resume) Good News About Hell/)).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText(/^(Play|Resume) Good News About Hell/));

    expect(onWatch).toHaveBeenCalledWith(PILOT, 900);
  });

  it('plays an episode nobody started from the beginning', async () => {
    jest.mocked(fetchShow).mockResolvedValue(TWO_SEASONS);

    const onWatch = jest.fn();
    const drawn = await render(
      around(
        <AShow
          libraryId="l"
          showId="s"
          onWatch={onWatch}
          onLookAt={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByLabelText(/^(Play|Resume) Good News About Hell/)).toBeTruthy();
    });

    await userEvent.press(drawn.getByLabelText(/^(Play|Resume) Good News About Hell/));

    expect(onWatch).toHaveBeenCalledWith(PILOT, 0);
  });

  it('says so where the programme could not be read', async () => {
    jest.mocked(fetchShow).mockResolvedValue(null);

    const drawn = await render(
      around(
        <AShow
          libraryId="l"
          showId="s"
          onWatch={jest.fn()}
          onLookAt={jest.fn()}
          onBack={jest.fn()}
        />,
      ),
    );

    await waitFor(() => {
      expect(drawn.getByText('That programme could not be read.')).toBeTruthy();
    });
  });
});
