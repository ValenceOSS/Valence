import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { Play } from '@keyline-icons/react-native';
import { Button } from '@ValenceTv/components/Button/Button';

describe('Button', () => {
  it('says what it does and does it when pressed', async () => {
    const onPress = jest.fn();
    const drawn = await render(<Button label="Play" icon={Play} onPress={onPress} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Play' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows its words unless it is only an icon', async () => {
    const words = await render(<Button label="Play" icon={Play} onPress={jest.fn()} />);

    expect(words.getByText('Play')).toBeTruthy();

    const iconOnly = await render(
      <Button label="Pause" icon={Play} isIconOnly onPress={jest.fn()} />,
    );

    expect(iconOnly.queryByText('Pause')).toBeNull();
    expect(iconOnly.getByRole('button', { name: 'Pause' })).toBeTruthy();
  });

  it('cannot be pressed while it is held off', async () => {
    const onPress = jest.fn();
    const drawn = await render(<Button label="Play" onPress={onPress} isDisabled />);

    await userEvent.press(drawn.getByRole('button', { name: 'Play' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('rings itself in white while the remote is on it, unless asked not to', async () => {
    const ringed = await render(<Button label="Like" icon={Play} isIconOnly onPress={jest.fn()} />);

    await fireEvent(ringed.getByRole('button', { name: 'Like' }), 'focus');

    expect(JSON.stringify(ringed.toJSON())).toContain('"borderColor":"#ffffff"');

    const bare = await render(
      <Button label="Like" icon={Play} isIconOnly isRingHidden onPress={jest.fn()} />,
    );

    await fireEvent(bare.getByRole('button', { name: 'Like' }), 'focus');

    expect(JSON.stringify(bare.toJSON())).not.toContain('"borderColor":"#ffffff"');
  });
});
