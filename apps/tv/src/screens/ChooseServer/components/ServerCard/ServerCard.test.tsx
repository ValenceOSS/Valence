import { render, userEvent } from '@testing-library/react-native';
import { Server } from '@keyline-icons/react-native';
import { ServerCard } from '@ValenceTv/screens/ChooseServer/components/ServerCard/ServerCard';

describe('ServerCard', () => {
  it('names the server and where it is', async () => {
    const drawn = await render(
      <ServerCard
        name="Living room"
        address="192.168.1.10:8420"
        icon={Server}
        onPress={jest.fn()}
      />,
    );

    expect(drawn.getByText('Living room')).toBeTruthy();
    expect(drawn.getByText('192.168.1.10:8420')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Living room, 192.168.1.10:8420' })).toBeTruthy();
  });

  it('says a server that answered just now is available where it has no address to show', async () => {
    const drawn = await render(
      <ServerCard
        name="Living room"
        address={null}
        icon={Server}
        isAvailable
        onPress={jest.fn()}
      />,
    );

    expect(drawn.getByText('Available')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Living room' })).toBeTruthy();
  });

  it('shows only the name where there is nothing else to say', async () => {
    const drawn = await render(
      <ServerCard name="Living room" address={null} icon={Server} onPress={jest.fn()} />,
    );

    expect(drawn.queryByText('Available')).toBeNull();
  });

  it('is chosen when pressed', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <ServerCard name="Living room" address={null} icon={Server} onPress={onPress} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Living room' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('cannot be chosen while it is held off', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <ServerCard name="Living room" address={null} icon={Server} isDisabled onPress={onPress} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Living room' }));

    expect(onPress).not.toHaveBeenCalled();
  });
});
