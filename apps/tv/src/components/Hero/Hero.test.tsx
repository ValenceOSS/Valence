import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, userEvent } from '@testing-library/react-native';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { Hero } from '@ValenceTv/components/Hero/Hero';
import type { ReactNode } from 'react';
import type { HeroProps } from '@ValenceTv/components/Hero/Hero.types';
import type { MediaDetail, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { ShowDetail } from '@ValenceContracts/schemas/Show';
import type { WatchProgress } from '@ValenceContracts/schemas/WatchProgress';

const ARRIVAL: MediaSummary = {
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: '00000000-0000-4000-8000-0000000000aa',
  title: 'Arrival',
  year: 2016,
  durationSeconds: 7200,
  width: 3840,
  height: 2160,
  videoCodec: 'hevc',
  videoRange: 'DolbyVision',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  seriesTitle: null,
  seasonNumber: null,
  episodeNumber: null,
  rating: 7.9,
  genres: ['Drama', 'Science Fiction', 'Mystery'],
};

const SICARIO: MediaSummary = {
  ...ARRIVAL,
  id: '00000000-0000-4000-8000-000000000002',
  title: 'Sicario',
  rating: null,
  genres: [],
};

const EPISODE: MediaSummary = {
  ...ARRIVAL,
  id: '00000000-0000-4000-8000-000000000003',
  title: 'System',
  seriesId: '00000000-0000-4000-8000-0000000000bb',
  seriesTitle: 'The Bear',
  seasonNumber: 1,
  episodeNumber: 1,
  rating: null,
  genres: [],
};

const ARRIVAL_DETAIL: MediaDetail = {
  id: ARRIVAL.id,
  libraryId: ARRIVAL.libraryId,
  title: 'Arrival',
  container: 'matroska',
  durationSeconds: 7200,
  videoCodec: 'hevc',
  videoRange: 'DolbyVision',
  videoBitDepth: 10,
  canCopySegments: true,
  videoIsInterlaced: false,
  width: 3840,
  height: 2160,
  bitrateKbps: 20_000,
  audioStreams: [{ index: 1, codec: 'eac3', channels: 6, isDefault: true, isAtmos: false }],
  subtitleStreams: [],
  addedAt: ARRIVAL.addedAt,
  metadata: {
    overview: 'A linguist is recruited to talk with visitors from elsewhere.',
    hasPoster: true,
    hasBackdrop: true,
    hasLogo: false,
  },
};

const THE_BEAR: ShowDetail = {
  id: '00000000-0000-4000-8000-0000000000bb',
  libraryId: ARRIVAL.libraryId,
  title: 'The Bear',
  seasonCount: 1,
  episodeCount: 8,
  latestAddedAt: '2026-08-10T00:00:00.000Z',
  coverMediaId: EPISODE.id,
  seriesId: '00000000-0000-4000-8000-0000000000bb',
  seasons: [],
  overview: 'A young chef comes home to run his family sandwich shop.',
};

const anAnsweringCache = (): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  cache.setQueryData(libraryQueries.detail(ARRIVAL.id).queryKey, ARRIVAL_DETAIL);
  cache.setQueryData(libraryQueries.detail(SICARIO.id).queryKey, null);
  cache.setQueryData(libraryQueries.detail(EPISODE.id).queryKey, null);
  cache.setQueryData(libraryQueries.show(EPISODE.libraryId, THE_BEAR.id).queryKey, THE_BEAR);

  return cache;
};

const drawHero = async (props: Partial<HeroProps> = {}) => {
  const cache = anAnsweringCache();
  const Scope = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={cache}>{children}</QueryClientProvider>
  );

  return render(
    <Hero
      items={[ARRIVAL]}
      progress={new Map<string, WatchProgress>()}
      isCovered={false}
      onPlay={jest.fn()}
      onInspect={jest.fn()}
      upTo={null}
      {...props}
    />,
    { wrapper: Scope },
  );
};

describe('Hero', () => {
  it('shows the title with everything needed to decide on it', async () => {
    const drawn = await drawHero();

    expect(drawn.getByText('Arrival')).toBeTruthy();
    expect(
      drawn.getByText('★ 7.9   ·   2016   ·   2:00:00   ·   Drama, Science Fiction'),
    ).toBeTruthy();
    expect(drawn.getByText('4K')).toBeTruthy();
    expect(drawn.getByText('Dolby Vision')).toBeTruthy();
    expect(drawn.getByText('5.1')).toBeTruthy();
    expect(
      drawn.getByText('A linguist is recruited to talk with visitors from elsewhere.'),
    ).toBeTruthy();
  });

  it('plays the title from the start', async () => {
    const onPlay = jest.fn();
    const drawn = await drawHero({ onPlay });

    await userEvent.press(drawn.getByRole('button', { name: 'Play' }));

    expect(onPlay).toHaveBeenCalledWith(ARRIVAL, 0);
  });

  it('offers to carry on from where this viewer left it', async () => {
    const onPlay = jest.fn();
    const progress = new Map<string, WatchProgress>([
      [
        ARRIVAL.id,
        {
          mediaId: ARRIVAL.id,
          positionSeconds: 1200,
          durationSeconds: 7200,
          isFinished: false,
          updatedAt: '2026-09-20T00:00:00.000Z',
        },
      ],
    ]);
    const drawn = await drawHero({ onPlay, progress });

    await userEvent.press(drawn.getByRole('button', { name: 'Resume 20:00' }));

    expect(onPlay).toHaveBeenCalledWith(ARRIVAL, 1200);
  });

  it('opens the title’s page', async () => {
    const onInspect = jest.fn();
    const drawn = await drawHero({ onInspect });

    await userEvent.press(drawn.getByRole('button', { name: 'More info' }));

    expect(onInspect).toHaveBeenCalledWith(ARRIVAL);
  });

  it('describes a show by the show rather than the episode', async () => {
    const drawn = await drawHero({ items: [EPISODE] });

    expect(drawn.getByText('The Bear')).toBeTruthy();
    expect(drawn.getByText('2016   ·   Series')).toBeTruthy();
    expect(
      drawn.getByText('A young chef comes home to run his family sandwich shop.'),
    ).toBeTruthy();
  });

  it('says which title is showing', async () => {
    const onFeature = jest.fn();

    await drawHero({ onFeature });

    expect(onFeature).toHaveBeenCalledWith(ARRIVAL);
  });

  it('asks the page to show it whole when the remote comes onto its buttons', async () => {
    const onReached = jest.fn();
    const drawn = await drawHero({ onReached });

    await fireEvent(drawn.getByRole('button', { name: 'More info' }), 'focus');

    expect(onReached).toHaveBeenCalledTimes(1);
  });

  it('draws nothing where there is nothing to feature', async () => {
    const drawn = await drawHero({ items: [] });

    expect(drawn.toJSON()).toBeNull();
  });

  describe('taking turns', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('moves on to the next title once a turn has run', async () => {
      const drawn = await drawHero({ items: [ARRIVAL, SICARIO] });

      expect(drawn.getByText('Arrival')).toBeTruthy();

      await act(() => {
        jest.advanceTimersByTime(21_000);
      });

      expect(drawn.getByText('Sicario')).toBeTruthy();
      expect(drawn.queryByText('Arrival')).toBeNull();
    });

    it('holds still while the remote is on its buttons', async () => {
      const drawn = await drawHero({ items: [ARRIVAL, SICARIO] });

      await fireEvent(drawn.getByRole('button', { name: 'Play' }), 'focus');

      await act(() => {
        jest.advanceTimersByTime(45_000);
      });

      expect(drawn.getByText('Arrival')).toBeTruthy();
    });

    it('holds still while another page covers it', async () => {
      const drawn = await drawHero({ items: [ARRIVAL, SICARIO], isCovered: true });

      await act(() => {
        jest.advanceTimersByTime(45_000);
      });

      expect(drawn.getByText('Arrival')).toBeTruthy();
    });
  });
});
