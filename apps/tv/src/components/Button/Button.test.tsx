import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { Play } from '@keyline-icons/react-native';
import { Button } from '@ValenceTv/components/Button/Button';
import { tokens } from '@ValenceTv/theme/tokens';

const RING = `"borderColor":"${tokens.colours.text}"`;

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

    expect(JSON.stringify(ringed.toJSON())).toContain(RING);

    const bare = await render(
      <Button label="Like" icon={Play} isIconOnly isRingHidden onPress={jest.fn()} />,
    );

    await fireEvent(bare.getByRole('button', { name: 'Like' }), 'focus');

    expect(JSON.stringify(bare.toJSON())).not.toContain(RING);
  });

  it('takes the height, padding and corner of the web at twice the size', async () => {
    const drawn = await render(<Button label="Save" size="md" onPress={jest.fn()} />);

    expect(drawn.getByText('Save').parent?.parent).toHaveStyle({
      minHeight: 64,
      paddingHorizontal: 24,
      borderRadius: tokens.radii.lg,
    });
  });

  it('writes on danger in the web destructive ink, not the accent', async () => {
    const drawn = await render(<Button label="Sign out" variant="danger" onPress={jest.fn()} />);

    expect(drawn.getByText('Sign out')).toHaveStyle({ color: tokens.colours.onDanger });
  });

  it('lifts a subtle button from muted to the full ink when the remote is on it', async () => {
    const drawn = await render(<Button label="Skip" variant="subtle" onPress={jest.fn()} />);

    expect(drawn.getByText('Skip')).toHaveStyle({ color: tokens.colours.muted });

    await fireEvent(drawn.getByRole('button', { name: 'Skip' }), 'focus');

    expect(drawn.getByText('Skip')).toHaveStyle({ color: tokens.colours.text });
  });

  it('underlines a link while the remote is on it', async () => {
    const drawn = await render(<Button label="Learn more" variant="link" onPress={jest.fn()} />);

    await fireEvent(drawn.getByRole('button', { name: 'Learn more' }), 'focus');

    expect(drawn.getByText('Learn more')).toHaveStyle({ textDecorationLine: 'underline' });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Button.displayName).toBe('Button');
  });
});
