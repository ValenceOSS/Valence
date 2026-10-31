import { ShieldCheck } from '@keyline-icons/react-native/fill';
import { render, userEvent } from '@testing-library/react-native';
import { theColours } from '@ValenceMobile/theme/theColours';
import { AnAccountRow } from './AnAccountRow';

describe('AnAccountRow', () => {
  it('says what it opens and a line about it, and opens it', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <AnAccountRow
        icon={ShieldCheck}
        tint="#30d158"
        says="Security"
        detail="Passkeys"
        onPress={onPress}
      />,
    );

    expect(drawn.getByText('Passkeys')).toBeTruthy();

    await userEvent.press(drawn.getByText('Security'));

    expect(onPress).toHaveBeenCalled();
  });

  it('says how many things are waiting in it', async () => {
    const drawn = await render(
      <AnAccountRow icon={ShieldCheck} says="Inbox" count={4} onPress={jest.fn()} />,
    );

    expect(drawn.getByText('4')).toBeTruthy();
  });

  it('draws something that cannot be taken back in red, with nothing to open', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <AnAccountRow icon={ShieldCheck} says="Sign out" isDestructive onPress={onPress} />,
    );

    expect(drawn.getByText('Sign out')).toHaveStyle({ color: theColours.light.danger });

    await userEvent.press(drawn.getByText('Sign out'));

    expect(onPress).toHaveBeenCalled();
  });
});
