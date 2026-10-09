import { render, userEvent } from '@testing-library/react-native';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { useDiscoverSearch } from '@ValenceClient/requests/useDiscoverSearch';
import { TheDiscoverPointer } from './TheDiscoverPointer';

jest.mock('@ValenceClient/requests/useDiscoverSearch');

const finding = (films: number, artists = 0) => {
  jest.mocked(useDiscoverSearch).mockReturnValue({
    films: Array.from({ length: films }, (_, at) => aCatalogueTitle({ id: `f-${at}` })),
    shows: [],
    artists: Array.from({ length: artists }, (_, at) =>
      aCatalogueTitle({ kind: 'artist', id: `a-${at}` }),
    ),
    books: [],
    count: films + artists,
    isPending: false,
  });
};

describe('TheDiscoverPointer', () => {
  it('says how many films and programmes Discover has for the same words', async () => {
    finding(2, 3);

    const drawn = await render(<TheDiscoverPointer asked="dune" onDiscover={jest.fn()} />);

    expect(drawn.getByText('Discover has 2 results for “dune” that you can request.')).toBeTruthy();
  });

  it('opens what Discover found for the same words', async () => {
    finding(1);
    const onDiscover = jest.fn();

    const drawn = await render(<TheDiscoverPointer asked="dune" onDiscover={onDiscover} />);
    await userEvent.press(drawn.getByText('See 1 result in Discover'));

    expect(onDiscover).toHaveBeenCalledWith('dune');
  });

  it('draws nothing where Discover has no films or programmes to ask for', async () => {
    finding(0, 4);

    const drawn = await render(<TheDiscoverPointer asked="dune" onDiscover={jest.fn()} />);

    expect(drawn.toJSON()).toBeNull();
  });
});
