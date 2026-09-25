import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AGroup } from './AGroup';

describe('AGroup', () => {
  it('says what the group is above it', async () => {
    const drawn = await render(
      <AGroup title="Whole libraries">
        <Text>Books</Text>
      </AGroup>,
    );

    expect(drawn.getByText('Whole libraries')).toBeTruthy();
  });

  it('draws every row it holds', async () => {
    const drawn = await render(
      <AGroup>
        <Text>Books</Text>
        <Text>Shows</Text>
      </AGroup>,
    );

    expect(drawn.getByText('Books')).toBeTruthy();
    expect(drawn.getByText('Shows')).toBeTruthy();
  });
});
