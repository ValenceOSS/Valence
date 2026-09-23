import { fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { Catalogue } from '@ValenceTv/screens/Catalogue/Catalogue';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const LIBRARY = '00000000-0000-4000-8000-0000000000aa';

const aMedia = (overrides: Partial<MediaSummary> = {}): MediaSummary => ({
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: LIBRARY,
  title: 'Arrival',
  year: 2016,
  durationSeconds: 6960,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-09-19T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  ...overrides,
});

const aCacheHolding = (kind: 'films' | 'shows', items: MediaSummary[] | null): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  if (items !== null) {
    cache.setQueryData(
      libraryQueries.everything([LIBRARY], { kind, order: 'title' }).queryKey,
      items,
    );
  }

  return cache;
};

const LAID_OUT = { nativeEvent: { layout: { x: 0, y: 0, width: 1920, height: 1080 } } };

const drawCatalogue = async (
  kind: 'films' | 'shows',
  items: MediaSummary[] | null,
  told: { onOpen?: (media: MediaSummary) => void; onFeature?: (media: MediaSummary) => void } = {},
) => {
  const drawn = await render(
    <QueryClientProvider client={aCacheHolding(kind, items)}>
      <Catalogue
        kind={kind}
        watchable={[LIBRARY]}
        onOpen={told.onOpen ?? jest.fn()}
        onFeature={told.onFeature ?? jest.fn()}
        upTo={null}
      />
    </QueryClientProvider>,
  );

  if (drawn.root !== null) {
    await fireEvent(drawn.root, 'layout', LAID_OUT);
  }

  return drawn;
};

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Catalogue', () => {
  it('says there are no films when the library has none', async () => {
    const drawn = await drawCatalogue('films', []);

    expect(drawn.getByText('There are no films here yet.')).toBeTruthy();
  });

  it('says there are no shows when the library has none', async () => {
    const drawn = await drawCatalogue('shows', []);

    expect(drawn.getByText('There are no shows here yet.')).toBeTruthy();
  });

  it('draws nothing to choose while the library is still being read', async () => {
    const drawn = await drawCatalogue('films', null);

    expect(drawn.queryByText('Films')).toBeNull();
    expect(drawn.queryByRole('button')).toBeNull();
  });

  it('shows every film as a poster and lights the page with the first', async () => {
    const arrival = aMedia();
    const onFeature = jest.fn();
    const drawn = await drawCatalogue(
      'films',
      [arrival, aMedia({ id: '00000000-0000-4000-8000-000000000002', title: 'Dune' })],
      { onFeature },
    );

    expect(drawn.getByText('Films')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Arrival' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Dune' })).toBeTruthy();
    expect(onFeature).toHaveBeenCalledWith(arrival);
  });

  it('shows a programme once however many episodes it has', async () => {
    const drawn = await drawCatalogue('shows', [
      aMedia({
        id: '00000000-0000-4000-8000-000000000003',
        title: 'Pilot',
        seriesId: 'severance',
        seriesTitle: 'Severance',
        seasonNumber: 1,
        episodeNumber: 1,
      }),
      aMedia({
        id: '00000000-0000-4000-8000-000000000004',
        title: 'Half Loop',
        seriesId: 'severance',
        seriesTitle: 'Severance',
        seasonNumber: 1,
        episodeNumber: 2,
      }),
    ]);

    expect(drawn.getByText('Shows')).toBeTruthy();
    expect(drawn.getAllByRole('button', { name: 'Severance' })).toHaveLength(1);
  });

  it('opens the title chosen', async () => {
    const arrival = aMedia();
    const onOpen = jest.fn();
    const drawn = await drawCatalogue('films', [arrival], { onOpen });

    await userEvent.press(drawn.getByRole('button', { name: 'Arrival' }));

    expect(onOpen).toHaveBeenCalledWith(arrival);
  });

  it('lights the page with the poster the remote rests on', async () => {
    const dune = aMedia({ id: '00000000-0000-4000-8000-000000000002', title: 'Dune' });
    const onFeature = jest.fn();
    const drawn = await drawCatalogue('films', [aMedia(), dune], { onFeature });

    await fireEvent(drawn.getByRole('button', { name: 'Dune' }), 'focus');

    await waitFor(() => {
      expect(onFeature).toHaveBeenLastCalledWith(dune);
    });
  });
});
