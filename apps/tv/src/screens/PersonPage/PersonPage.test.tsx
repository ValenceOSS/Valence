import { fireEvent, render, userEvent } from '@testing-library/react-native';
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
 * @param portraitUrl - Their portrait, where there is one.
 * @returns The cache.
 */
const aCache = (biography: string | null, portraitUrl: string | null = null): QueryClient => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  const amy: Person = {
    id: 101,
    name: 'Amy Adams',
    portraitUrl,
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

/**
 * Has the biography measured whole come out so tall, as the television lays it out.
 *
 * @param drawn - The page.
 * @param text - How the biography starts.
 * @param height - How tall it came out.
 */
const measuredAt = async (
  drawn: Awaited<ReturnType<typeof render>>,
  text: RegExp,
  height: number,
): Promise<void> => {
  const measured = drawn.getAllByText(text, { includeHiddenElements: true }).at(-1);

  if (measured === undefined) {
    throw new Error('The biography was not measured.');
  }

  await fireEvent(measured, 'layout', { nativeEvent: { layout: { height } } });
};

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('PersonPage', () => {
  it('says who they are, where they were born, how much of theirs is here and what is said of them', async () => {
    const drawn = await render(
      <QueryClientProvider client={aCache('An American actress.')}>
        <PersonPage personId={101} onOpen={jest.fn()} onLight={jest.fn()} />
      </QueryClientProvider>,
    );

    expect(drawn.getByText('Amy Adams')).toBeTruthy();
    expect(drawn.getByText('Vicenza, Italy   ·   1 film')).toBeTruthy();
    expect(drawn.getByText('An American actress.')).toBeTruthy();
  });

  it('shelves only the kinds of thing they are in here, each opening its page', async () => {
    const onOpen = jest.fn();
    const drawn = await render(
      <QueryClientProvider client={aCache(null)}>
        <PersonPage personId={101} onOpen={onOpen} onLight={jest.fn()} />
      </QueryClientProvider>,
    );

    expect(drawn.getByText('Films')).toBeTruthy();
    expect(drawn.queryByText('Episodes')).toBeNull();

    await userEvent.press(await drawn.findByRole('button', { name: 'Arrival' }));

    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ title: 'Arrival' }));
  });

  it('lights the page with their portrait, then with whichever of theirs the remote rests on', async () => {
    const onLight = jest.fn();
    const drawn = await render(
      <QueryClientProvider client={aCache(null, 'https://pictures.example/amy.jpg')}>
        <PersonPage personId={101} onOpen={jest.fn()} onLight={onLight} />
      </QueryClientProvider>,
    );

    expect(onLight).toHaveBeenLastCalledWith('https://pictures.example/amy.jpg');

    await fireEvent(await drawn.findByRole('button', { name: 'Arrival' }), 'focus');

    expect(onLight).toHaveBeenLastCalledWith(
      `/api/media/${ARRIVAL.id}/image/backdrop?of=title&size=medium`,
    );
  });

  it('offers no more of a biography that fits', async () => {
    const drawn = await render(
      <QueryClientProvider client={aCache('An American actress.')}>
        <PersonPage personId={101} onOpen={jest.fn()} onLight={jest.fn()} />
      </QueryClientProvider>,
    );

    await measuredAt(drawn, /^An American actress/u, 34);

    expect(drawn.queryByRole('button', { name: 'Read more' })).toBeNull();
  });

  it('opens their whole biography over the page', async () => {
    const drawn = await render(
      <QueryClientProvider client={aCache('An American actress.\n\nShe sings too.')}>
        <PersonPage personId={101} onOpen={jest.fn()} onLight={jest.fn()} />
      </QueryClientProvider>,
    );

    expect(drawn.queryByText('About Amy Adams')).toBeNull();

    await measuredAt(drawn, /^An American actress/u, 400);
    await userEvent.press(drawn.getByRole('button', { name: 'Read more' }));

    expect(drawn.getByText('About Amy Adams')).toBeTruthy();
    expect(drawn.getByText('She sings too.')).toBeTruthy();
  });

  it('says what could not be read, and asks again', async () => {
    const cache = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
    });
    const fetching = jest
      .spyOn(global, 'fetch')
      .mockImplementation(() => Promise.resolve(new Response('{}', { status: 500 })));

    const drawn = await render(
      <QueryClientProvider client={cache}>
        <PersonPage personId={101} onOpen={jest.fn()} onLight={jest.fn()} />
      </QueryClientProvider>,
    );

    expect(await drawn.findByText('Couldn’t load their details.')).toBeTruthy();
    expect(drawn.queryByText('Somebody')).toBeNull();

    const before = fetching.mock.calls.length;

    await userEvent.press(drawn.getByRole('button', { name: 'Try again' }));

    expect(fetching.mock.calls.length).toBeGreaterThan(before);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PersonPage.displayName).toBe('PersonPage');
  });
});
