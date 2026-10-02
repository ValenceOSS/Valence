import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { PlayerPanel } from './PlayerPanel';

describe('PlayerPanel', () => {
  it('draws what it holds under its title', async () => {
    const drawn = await render(
      <PlayerPanel title="Settings">
        <Text>Inside</Text>
      </PlayerPanel>,
    );

    expect(drawn.getByText('Settings')).toBeTruthy();
    expect(drawn.getByText('Inside')).toBeTruthy();
  });
});
