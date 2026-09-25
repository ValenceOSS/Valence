import { render, userEvent } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { CatalogueShelf } from '@ValenceTv/components/CatalogueShelf/CatalogueShelf';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';

const aTitle = (id: string, title: string): CatalogueTitle => ({
  kind: 'film',
  id,
  title,
  subtitle: null,
  year: 2021,
  overview: null,
  posterUrl: null,
  standing: { status: 'askable', mediaId: null, requestId: null, requestState: null },
});

const TITLES = [aTitle('1', 'Dune'), aTitle('2', 'Arrival'), aTitle('3', 'Sicario')];

describe('CatalogueShelf', () => {
  it('names the row and shows what is on it', async () => {
    const drawn = await render(
      <CatalogueShelf title="Trending" titles={TITLES} onOpen={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByText('Trending')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Dune' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Arrival' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Sicario' })).toBeTruthy();
  });

  it('says which title was chosen', async () => {
    const onOpen = jest.fn();
    const drawn = await render(
      <CatalogueShelf title="Trending" titles={TITLES} onOpen={onOpen} />,
      { wrapper: CacheScope },
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Arrival' }));

    expect(onOpen).toHaveBeenCalledWith(TITLES[1]);
  });

  it('keeps a film and a show that share a number apart', async () => {
    const drawn = await render(
      <CatalogueShelf
        title="Popular"
        titles={[aTitle('7', 'Film seven'), { ...aTitle('7', 'Show seven'), kind: 'series' }]}
        onOpen={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByRole('button', { name: 'Film seven' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Show seven' })).toBeTruthy();
  });
});
