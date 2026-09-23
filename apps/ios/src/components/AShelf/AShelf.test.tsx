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
});
