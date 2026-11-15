import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchCollections } from '@ValenceClient/collections/fetchCollections';
import type { useHomeRows } from '@ValenceClient/library/useHomeRows';
import { AHomeShelf } from '@ValenceMobile/components/TheLibrary/components/TheHome/components/AHomeShelf/AHomeShelf';
import { TheFeatured } from '@ValenceMobile/components/TheLibrary/components/TheFeatured/TheFeatured';
import { aTitle } from '@ValenceMobile/testing/aTitle';
import { TheHome } from './TheHome';

const mockRows: { made: (() => ReturnType<typeof useHomeRows>) | null } = { made: null };

jest.mock('@ValenceClient/library/useHomeRows', () => {
  const { useHomeRows: actual } = jest.requireActual<{ useHomeRows: typeof useHomeRows }>(
    '@ValenceClient/library/useHomeRows',
  );

  return {
    useHomeRows: (...asked: Parameters<typeof useHomeRows>) =>
      mockRows.made === null ? actual(...asked) : mockRows.made(),
  };
});

jest.mock(
  '@ValenceMobile/components/TheLibrary/components/TheHome/components/AHomeShelf/AHomeShelf',
  () => ({ AHomeShelf: jest.fn(() => null) }),
);

jest.mock('@ValenceMobile/components/TheLibrary/components/TheFeatured/TheFeatured', () => {
  const { Text: Said } = jest.requireActual<{ Text: typeof Text }>('react-native');

  return { TheFeatured: jest.fn(() => <Said>Featured</Said>) };
});

jest.mock('@ValenceClient/collections/fetchCollections', () => ({
  ...jest.requireActual<object>('@ValenceClient/collections/fetchCollections'),
  fetchCollections: jest.fn(),
}));

const aHome = (librariesAre: 'reading' | 'missing' | 'there') => (
  <TheHome
    header={null}
    watchable={[]}
    librariesAre={librariesAre}
    onWatch={jest.fn()}
    onLookAt={jest.fn()}
    onLookAtShow={jest.fn()}
    onShowing={jest.fn()}
  />
);

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchCollections).mockResolvedValue([]);
  mockRows.made = null;
});

describe('TheHome', () => {
  it('says there are no libraries yet on a server that has none', async () => {
    const drawn = await render(aHome('missing'), { wrapper: CacheScope });

    expect(await drawn.findByText('No libraries yet')).toBeTruthy();
  });

  it('leaves the collections to the films and the shows', async () => {
    jest.mocked(fetchCollections).mockResolvedValue([
      {
        id: '3fa85f64-5717-4562-b3fc-2c963f66c011',
        name: 'Saga',
        description: null,
        isOrdered: true,
        hasOwnArtwork: false,
        isSmart: false,
        holds: ['film', 'series'],
        rules: null,
        owner: null,
        isMine: false,
        isShared: false,
        entryCount: 2,
        coverMediaIds: [],
        updatedAt: '2026-10-02T00:00:00.000Z',
      },
    ]);

    const drawn = await render(aHome('there'), { wrapper: CacheScope });

    expect(drawn.queryByText('Collections')).toBeNull();
    expect(fetchCollections).not.toHaveBeenCalled();
  });

  it('calls nothing empty while the libraries are still being read', async () => {
    const drawn = await render(aHome('reading'), { wrapper: CacheScope });

    expect(drawn.queryByText('No libraries yet')).toBeNull();
  });

  it('tells whoever asked only when the page leaves its top or comes back to it', async () => {
    const onScrolled = jest.fn();
    const drawn = await render(
      <TheHome
        header={<Text>Above</Text>}
        watchable={[]}
        librariesAre="there"
        onWatch={jest.fn()}
        onLookAt={jest.fn()}
        onLookAtShow={jest.fn()}
        onShowing={jest.fn()}
        onScrolled={onScrolled}
      />,
      { wrapper: CacheScope },
    );
    const scrolledTo = (y: number) => ({ nativeEvent: { contentOffset: { y } } });

    await fireEvent.scroll(drawn.getByText('Above'), scrolledTo(10));
    await fireEvent.scroll(drawn.getByText('Above'), scrolledTo(40));
    await fireEvent.scroll(drawn.getByText('Above'), scrolledTo(0));

    expect(onScrolled.mock.calls).toEqual([[true], [false]]);
  });

  it('hands the shelves the same flags while the flags stay the same, however often they are rebuilt', async () => {
    const fresh = aTitle({ addedAt: new Date().toISOString() });

    mockRows.made = () => ({
      rails: [{ id: 'new', title: 'New', items: [fresh] }],
      isReading: false,
      hasMore: false,
      isReadingMore: false,
      showMore: jest.fn(),
    });
    jest.mocked(AHomeShelf).mockClear();

    const drawn = await render(aHome('there'), { wrapper: CacheScope });

    await drawn.rerender(aHome('there'));
    await drawn.rerender(aHome('there'));

    const flags = jest.mocked(AHomeShelf).mock.calls.map(([shelf]) => shelf.flagOf);

    expect(flags.length).toBeGreaterThan(1);
    expect(new Set(flags).size).toBe(1);
    expect(flags[0]?.(fresh)).not.toBeNull();
  });

  it('stops the hero only once it has been scrolled out of view, and starts it once it is back', async () => {
    jest.mocked(TheFeatured).mockClear();
    const drawn = await render(aHome('there'), { wrapper: CacheScope });
    const scrolledTo = (y: number) => ({ nativeEvent: { contentOffset: { y } } });

    await fireEvent(drawn.getByText('Featured'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 500 } },
    });
    const isInView = () => jest.mocked(TheFeatured).mock.lastCall?.[0].isInView;
    const drawnBefore = jest.mocked(TheFeatured).mock.calls.length;

    await fireEvent.scroll(drawn.getByText('Featured'), scrolledTo(100));
    await fireEvent.scroll(drawn.getByText('Featured'), scrolledTo(200));

    expect(jest.mocked(TheFeatured).mock.calls.length).toBe(drawnBefore);
    expect(isInView()).toBe(true);

    await fireEvent.scroll(drawn.getByText('Featured'), scrolledTo(450));
    await fireEvent.scroll(drawn.getByText('Featured'), scrolledTo(600));

    expect(isInView()).toBe(false);

    await fireEvent.scroll(drawn.getByText('Featured'), scrolledTo(10));

    expect(isInView()).toBe(true);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TheHome.displayName).toBe('TheHome');
  });
});
