import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { ARising } from './ARising';

describe('ARising', () => {
  it('draws what it holds as it rises into place', async () => {
    const drawn = await render(
      <ARising turn={1}>
        <Text>Arrival</Text>
      </ARising>,
    );

    expect(drawn.getByText('Arrival')).toBeTruthy();
  });
});
