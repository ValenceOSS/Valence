import { render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { collectionQueries } from '@ValenceClient/query/collectionQueries';
import { CollectionShelves } from '@ValenceTv/components/CollectionShelves/CollectionShelves';
import type { CollectionEntry } from '@ValenceContracts/schemas/Collection';

const SAGA_ID = '00000000-0000-4000-8000-00000000c011';

/**
 * An entry of the collection.
 *
 * @param at - Which one, which names it.
 * @param title - What it is called.
 * @param year - When it came out.
 * @returns The entry.
 */
const anEntry = (at: number, title: string, year: number): CollectionEntry => ({
  id: `00000000-0000-4000-8000-00000000e00${at.toString()}`,
  position: at,
  addedAt: '2026-10-02T00:00:00.000Z',
  kind: 'film',
  media: {
    id: `00000000-0000-4000-8000-00000000f00${at.toString()}`,
    libraryId: '00000000-0000-4000-8000-0000000000aa',
    title,
    year,
    durationSeconds: 60,
    width: 1920,
    height: 1080,
    videoCodec: 'h264',
    videoRange: 'SDR',
    addedAt: '2026-10-02T00:00:00.000Z',
    hasPoster: true,
    hasBackdrop: true,
    hasLogo: false,
    seriesId: null,
  },
});

const SAGA = {
  id: SAGA_ID,
  name: 'Saga',
  description: null,
  isOrdered: false,
  hasOwnArtwork: false,
  entryCount: 2,
  coverMediaIds: [],
  updatedAt: '2026-10-02T00:00:00.000Z',
};

/**
 * A cache already holding the collections, as though they had been read.
 *
 * @param entries - What the one collection holds.
 * @returns The cache.
 */
const aCache = (entries: CollectionEntry[]): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  cache.setQueryData(collectionQueries.all().queryKey, [SAGA]);
  cache.setQueryData(collectionQueries.one(SAGA_ID).queryKey, { collection: SAGA, entries });

  return cache;
};

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('CollectionShelves', () => {
  it('puts a collection on a shelf of its own, oldest first, each title opening', async () => {
    const onOpen = jest.fn();
    const drawn = await render(
      <QueryClientProvider client={aCache([anEntry(1, 'Return', 1983), anEntry(2, 'Hope', 1977)])}>
        <CollectionShelves progress={new Map()} onOpen={onOpen} />
      </QueryClientProvider>,
    );

    expect(await drawn.findByText('Saga')).toBeTruthy();

    const [first] = await drawn.findAllByRole('button', { name: /Hope|Return/ });

    expect(first).toBe(drawn.getByRole('button', { name: 'Hope' }));

    await userEvent.press(await drawn.findByRole('button', { name: 'Hope' }));

    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ title: 'Hope' }));
  });

  it('leaves out a collection holding nothing this viewer may watch', async () => {
    const drawn = await render(
      <QueryClientProvider client={aCache([])}>
        <CollectionShelves progress={new Map()} onOpen={jest.fn()} />
      </QueryClientProvider>,
    );

    expect(drawn.queryByText('Saga')).toBeNull();
  });
});
