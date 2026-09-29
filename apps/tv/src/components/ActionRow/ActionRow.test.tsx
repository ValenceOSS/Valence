import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { Play } from '@keyline-icons/react-native';
import { ActionRow } from '@ValenceTv/components/ActionRow/ActionRow';
import { tokens } from '@ValenceTv/theme/tokens';

describe('ActionRow', () => {
  it('says what it does and does it when pressed', async () => {
    const onPress = jest.fn();
    const drawn = await render(<ActionRow label="Play" icon={Play} onPress={onPress} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Play' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(drawn.getByText('Play')).toBeTruthy();
  });

  it('says more after its label where there is more to say', async () => {
    const drawn = await render(<ActionRow label="720p" detail="1.4 Mbps" onPress={jest.fn()} />);

    expect(drawn.getByText('1.4 Mbps')).toBeTruthy();
    expect(drawn.getByRole('button', { name: '720p, 1.4 Mbps' })).toBeTruthy();
  });

  it('is passed by where it is not to be pressed', async () => {
    const drawn = await render(<ActionRow label="720p" onPress={jest.fn()} isDisabled />);

    expect(drawn.getByRole('button', { name: '720p' })).toBeDisabled();
  });

  it('lights its words dark on white while the remote is on it', async () => {
    const drawn = await render(<ActionRow label="Trailer" onPress={jest.fn()} />);

    expect(drawn.getByText('Trailer')).toHaveStyle({ color: tokens.colours.text });

    await fireEvent(drawn.getByRole('button', { name: 'Trailer' }), 'focus');

    expect(drawn.getByText('Trailer')).toHaveStyle({ color: tokens.colours.onWhite });
  });

  it('asks for the remote when it is where the page starts', async () => {
    const drawn = await render(
      <ActionRow
        label="Resume"
        icon={Play}
        watchedFraction={0.4}
        hasPreferredFocus
        onPress={jest.fn()}
      />,
    );

    expect(drawn.getByRole('button', { name: 'Resume' })).toHaveProp('hasTVPreferredFocus', true);
  });
});
