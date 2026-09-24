import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { TheClipBehind } from './TheClipBehind';

describe('TheClipBehind', () => {
  it('draws what sits in front of it while no clip plays', async () => {
    const drawn = await render(
      <TheClipBehind player={null}>
        <Text>Home</Text>
      </TheClipBehind>,
    );

    expect(drawn.getByText('Home')).toBeTruthy();
  });
});
