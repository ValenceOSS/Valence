import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fetchLibraryItems } from '@ValenceClient/library/fetchLibrary';
import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { TheResults } from './TheResults';
import type { ReactNode } from 'react';

jest.mock('@ValenceClient/library/fetchLibrary');

const around = (children: ReactNode) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const aResult = (id: string, title: string, extra: Partial<MediaSummary> = {}) =>
  MediaSummarySchema.parse({
    id,
    libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
    title,
    year: 2016,
    durationSeconds: 6960,
    width: 1920,
    height: 1080,
    videoCodec: 'hevc',
    videoRange: 'SDR',
    addedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  });

const ARRIVAL = aResult('3fa85f64-5717-4562-b3fc-2c963f66af01', 'Arrival');

const theResults = (onLookAt = jest.fn(), onLookAtShow = jest.fn()) =>
  around(
    <TheResults
      asked="arr"
      libraryIds={['one']}
      howFarThrough={() => 0}
      onLookAt={onLookAt}
      onLookAtShow={onLookAtShow}
    />,
  );

beforeEach(() => {
  jest.mocked(fetchLibraryItems).mockReset();
});

describe('TheResults', () => {
  it('asks every library for what was searched', async () => {
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [ARRIVAL], total: 1 });

    await render(theResults());

    await waitFor(() => {
      expect(fetchLibraryItems).toHaveBeenCalledWith(
        'one',
        expect.objectContaining({ search: 'arr' }),
      );
    });
  });

  it('shows what it found', async () => {
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [ARRIVAL], total: 1 });

    const drawn = await render(theResults());

    await waitFor(() => {
      expect(drawn.getByLabelText('Arrival')).toBeTruthy();
    });
  });

  it('opens a film as itself', async () => {
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [ARRIVAL], total: 1 });

    const onLookAt = jest.fn();
    const drawn = await render(theResults(onLookAt));

    await waitFor(() => {
      expect(drawn.getByLabelText('Arrival')).toBeTruthy();
    });
    await userEvent.press(drawn.getByLabelText('Arrival'));

    expect(onLookAt).toHaveBeenCalledWith(ARRIVAL.id);
  });

  it('shows a programme once however many of its episodes matched', async () => {
    jest.mocked(fetchLibraryItems).mockResolvedValue({
      items: [
        aResult('3fa85f64-5717-4562-b3fc-2c963f66af11', 'Pilot', {
          seriesTitle: 'Severance',
          seasonNumber: 1,
          episodeNumber: 1,
        }),
        aResult('3fa85f64-5717-4562-b3fc-2c963f66af12', 'Half Loop', {
          seriesTitle: 'Severance',
          seasonNumber: 1,
          episodeNumber: 2,
        }),
      ],
      total: 2,
    });

    const drawn = await render(theResults());

    await waitFor(() => {
      expect(drawn.getAllByLabelText('Severance')).toHaveLength(1);
    });
  });

  it('opens a programme as the programme, not the episode that matched', async () => {
    jest.mocked(fetchLibraryItems).mockResolvedValue({
      items: [
        aResult('3fa85f64-5717-4562-b3fc-2c963f66af11', 'Pilot', {
          seriesTitle: 'Severance',
          seasonNumber: 1,
          episodeNumber: 1,
        }),
      ],
      total: 1,
    });

    const onLookAtShow = jest.fn();
    const drawn = await render(theResults(jest.fn(), onLookAtShow));

    await waitFor(() => {
      expect(drawn.getByLabelText('Severance')).toBeTruthy();
    });
    await userEvent.press(drawn.getByLabelText('Severance'));

    expect(onLookAtShow).toHaveBeenCalledWith('3fa85f64-5717-4562-b3fc-2c963f66afa7', 'severance');
  });

  it('says so where nothing matched', async () => {
    jest.mocked(fetchLibraryItems).mockResolvedValue({ items: [], total: 0 });

    const drawn = await render(theResults());

    await waitFor(() => {
      expect(drawn.getByText('Nothing called “arr”.')).toBeTruthy();
    });
  });
});
