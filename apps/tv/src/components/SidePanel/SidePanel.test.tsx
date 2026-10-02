import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SidePanel } from './SidePanel';

describe('SidePanel', () => {
  it('draws what it holds under its title', async () => {
    const drawn = await render(
      <SidePanel title="Settings">
        <Text>Inside</Text>
      </SidePanel>,
    );

    expect(drawn.getByText('Settings')).toBeTruthy();
    expect(drawn.getByText('Inside')).toBeTruthy();
  });
});
