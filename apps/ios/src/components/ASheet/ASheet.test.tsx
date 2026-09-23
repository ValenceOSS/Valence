import { Text } from 'react-native';
import { render, userEvent } from '@testing-library/react-native';
import { ASheet } from './ASheet';

describe('ASheet', () => {
  it('says what it is for, holds its contents, and goes when put away', async () => {
    const onClose = jest.fn();
    const drawn = await render(
      <ASheet isOpen title="Play on" onClose={onClose}>
        <Text>Living room</Text>
      </ASheet>,
    );

    expect(drawn.getByText('Play on')).toBeTruthy();
    expect(drawn.getByText('Living room')).toBeTruthy();

    await userEvent.press(drawn.getByText('Done'));

    expect(onClose).toHaveBeenCalled();
  });

  it('says what putting it away does, where it is not simply done', async () => {
    const drawn = await render(
      <ASheet isOpen title="New playlist" closeLabel="Cancel" onClose={jest.fn()}>
        <Text>Name</Text>
      </ASheet>,
    );

    expect(drawn.getByText('Cancel')).toBeTruthy();
  });
});
