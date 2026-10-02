import { render, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { TheSidePanel } from './TheSidePanel';

describe('TheSidePanel', () => {
  it('draws what it holds under its title', async () => {
    const drawn = await render(
      <TheSidePanel title="Settings" closeLabel="Close" onClose={jest.fn()}>
        <Text>Inside</Text>
      </TheSidePanel>,
    );

    expect(drawn.getByText('Settings')).toBeTruthy();
    expect(drawn.getByText('Inside')).toBeTruthy();
  });

  it('closes from its cross, or from the film beside it', async () => {
    const onClose = jest.fn();
    const drawn = await render(
      <TheSidePanel title="Settings" closeLabel="Close" onClose={onClose}>
        <Text>Inside</Text>
      </TheSidePanel>,
    );

    for (const way of drawn.getAllByLabelText('Close')) {
      await userEvent.press(way);
    }

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
