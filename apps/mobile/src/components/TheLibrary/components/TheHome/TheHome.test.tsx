import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchCollections } from '@ValenceClient/collections/fetchCollections';
import { TheHome } from './TheHome';

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
    onLookAtCollection={jest.fn()}
    onShowing={jest.fn()}
    onClip={jest.fn()}
  />
);

beforeEach(() => {
  installPlatform(aFakePlatform());
  jest.mocked(fetchCollections).mockResolvedValue([]);
});

describe('TheHome', () => {
  it('says there are no libraries yet on a server that has none', async () => {
    const drawn = await render(aHome('missing'), { wrapper: CacheScope });

    expect(await drawn.findByText('No libraries yet')).toBeTruthy();
  });

  it('puts the collections on a shelf of their own', async () => {
    jest.mocked(fetchCollections).mockResolvedValue([
      {
        id: '3fa85f64-5717-4562-b3fc-2c963f66c011',
        name: 'Saga',
        description: null,
        isOrdered: true,
        hasOwnArtwork: false,
        entryCount: 2,
        coverMediaIds: [],
        updatedAt: '2026-10-02T00:00:00.000Z',
      },
    ]);

    const drawn = await render(aHome('there'), { wrapper: CacheScope });

    expect(await drawn.findByText('Collections')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Saga' })).toBeTruthy();
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
        onLookAtCollection={jest.fn()}
        onShowing={jest.fn()}
        onClip={jest.fn()}
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

  it('sets a display name so devtools can identify it', () => {
    expect(TheHome.displayName).toBe('TheHome');
  });
});
