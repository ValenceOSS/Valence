import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AShelf } from './AShelf';

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
});
