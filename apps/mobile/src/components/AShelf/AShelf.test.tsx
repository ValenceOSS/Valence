import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AShelf } from './AShelf';

/**
 * Draws a film's name, as a card would.
 *
 * @param film - The film.
 * @returns Its name.
 */
const aCard = (film: string) => <Text>{film}</Text>;

/**
 * What tells one film from another.
 *
 * @param film - The film.
 * @returns Its name.
 */
const nameOf = (film: string) => film;

describe('AShelf', () => {
  it('says what the shelf is', async () => {
    const drawn = await render(
      <AShelf title="Trending">
        <Text>Dune</Text>
      </AShelf>,
    );

    expect(drawn.getByText('Trending')).toBeTruthy();
  });

  it('holds what was put on it', async () => {
    const drawn = await render(
      <AShelf title="Trending">
        <Text>Dune</Text>
      </AShelf>,
    );

    expect(drawn.getByText('Dune')).toBeTruthy();
  });

  it('draws the first cards of a long shelf and leaves the rest until they are near', async () => {
    const drawn = await render(
      <AShelf title="Recently added">
        {Array.from({ length: 40 }, (_, at) => (
          <Text key={`film-${at.toString()}`}>{`Film ${at.toString()}`}</Text>
        ))}
      </AShelf>,
    );

    expect(drawn.getByText('Film 0')).toBeTruthy();
    expect(drawn.queryByText('Film 39')).toBeNull();
  });

  it('draws a card for each thing it is told about, as they come into view', async () => {
    const films = Array.from({ length: 40 }, (_, at) => `Film ${at.toString()}`);
    const drawn = await render(
      <AShelf title="Recently added" items={films} keyOf={nameOf} drawn={aCard} cardWidth={104} />,
    );

    expect(drawn.getByText('Recently added')).toBeTruthy();
    expect(drawn.getByText('Film 0')).toBeTruthy();
    expect(drawn.queryByText('Film 39')).toBeNull();
  });

  it('draws a card again only when what it is for changes', async () => {
    const drawing = jest.fn(aCard);
    const films = ['Dune', 'Arrival'];
    const drawn = await render(
      <AShelf title="Recently added" items={films} keyOf={nameOf} drawn={drawing} />,
    );

    drawing.mockClear();

    await drawn.rerender(
      <AShelf title="Recently added" items={films} keyOf={nameOf} drawn={drawing} />,
    );

    expect(drawing).not.toHaveBeenCalled();
  });

  it('offers everything the shelf only shows the start of, where it can', async () => {
    const drawn = await render(
      <AShelf
        title="Recently added"
        onSeeAll={jest.fn()}
        items={['Dune']}
        keyOf={nameOf}
        drawn={aCard}
      />,
    );

    expect(drawn.getByRole('button', { name: 'See all recently added' })).toBeTruthy();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AShelf.displayName).toBe('AShelf');
  });
});
