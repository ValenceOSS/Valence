import { render, userEvent, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ASidePanel } from './ASidePanel';

describe('ASidePanel', () => {
  it('draws what it holds under its title', async () => {
    const drawn = await render(
      <ASidePanel title="Settings" closeLabel="Close" onClose={jest.fn()}>
        <Text>Inside</Text>
      </ASidePanel>,
    );

    expect(drawn.getByText('Settings')).toBeTruthy();
    expect(drawn.getByText('Inside')).toBeTruthy();
  });

  it.each([
    ['the film beside it', 0],
    ['its cross', 1],
  ])('closes from %s, once it has slid away', async (_way, which) => {
    const onClose = jest.fn();
    const drawn = await render(
      <ASidePanel title="Settings" closeLabel="Close" onClose={onClose}>
        <Text>Inside</Text>
      </ASidePanel>,
    );

    const way = drawn.getAllByLabelText('Close')[which];

    if (way !== undefined) {
      await userEvent.press(way);
    }

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
