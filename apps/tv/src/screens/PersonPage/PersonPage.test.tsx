import { render, userEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { viewingQueries } from '@ValenceClient/query/viewingQueries';
import { PersonPage } from '@ValenceTv/screens/PersonPage/PersonPage';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { Person } from '@ValenceContracts/schemas/Person';

const ARRIVAL: MediaSummary = {
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: '00000000-0000-4000-8000-0000000000aa',
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
};

/**
 * A cache already holding the person and what they are in.
 *
 * @param biography - What the catalogue says of them.
 * @returns The cache.
 */
const aCache = (biography: string | null): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  const amy: Person = {
    id: 101,
    name: 'Amy Adams',
    portraitUrl: null,
    biography,
    bornOn: null,
    bornIn: 'Vicenza, Italy',
  };

  cache.setQueryData(libraryQueries.person(101).queryKey, amy);
  cache.setQueryData(libraryQueries.credits(101).queryKey, {
    films: [ARRIVAL],
    shows: [],
    episodes: [],
  });
  cache.setQueryData(viewingQueries.progress().queryKey, []);

  return cache;
};

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('PersonPage', () => {
  it('says who they are, where they were born and what is said of them', async () => {
    const drawn = await render(
      <QueryClientProvider client={aCache('An American actress.')}>
        <PersonPage personId={101} onOpen={jest.fn()} />
      </QueryClientProvider>,
    );

    expect(drawn.getByText('Amy Adams')).toBeTruthy();
    expect(drawn.getByText('Vicenza, Italy')).toBeTruthy();
    expect(drawn.getByText('An American actress.')).toBeTruthy();
  });

  it('shelves only the kinds of thing they are in here, each opening its page', async () => {
    const onOpen = jest.fn();
    const drawn = await render(
      <QueryClientProvider client={aCache(null)}>
        <PersonPage personId={101} onOpen={onOpen} />
      </QueryClientProvider>,
    );

    expect(drawn.getByText('Films')).toBeTruthy();
    expect(drawn.queryByText('Episodes')).toBeNull();

    await userEvent.press(await drawn.findByRole('button', { name: 'Arrival' }));

    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ title: 'Arrival' }));
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PersonPage.displayName).toBe('PersonPage');
  });
});
