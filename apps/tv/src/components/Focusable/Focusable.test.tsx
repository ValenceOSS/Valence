import { Text } from 'react-native';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';

describe('Focusable', () => {
  it('is a button called what it is told, and is told when pressed', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <Focusable label="Open Arrival" onPress={onPress}>
        <Text>Arrival</Text>
      </Focusable>,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Open Arrival' }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(drawn.getByText('Arrival')).toBeTruthy();
  });

  it('tells what is inside whether the remote is on it', async () => {
    const drawn = await render(
      <Focusable label="Arrival">
        {(isFocused) => <Text>{isFocused ? 'Lit' : 'Quiet'}</Text>}
      </Focusable>,
    );

    expect(drawn.getByText('Quiet')).toBeTruthy();

    await fireEvent(drawn.getByRole('button', { name: 'Arrival' }), 'focus');

    expect(drawn.getByText('Lit')).toBeTruthy();

    await fireEvent(drawn.getByRole('button', { name: 'Arrival' }), 'blur');

    expect(drawn.getByText('Quiet')).toBeTruthy();
  });

  it('says when the remote lands on it and leaves it', async () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const drawn = await render(
      <Focusable label="Arrival" onFocus={onFocus} onBlur={onBlur}>
        <Text>Arrival</Text>
      </Focusable>,
    );

    await fireEvent(drawn.getByRole('button', { name: 'Arrival' }), 'focus');

    expect(onFocus).toHaveBeenCalledTimes(1);

    await fireEvent(drawn.getByRole('button', { name: 'Arrival' }), 'blur');

    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('asks for the remote only until it has had it once', async () => {
    const drawn = await render(
      <Focusable label="Play" hasPreferredFocus>
        <Text>Play</Text>
      </Focusable>,
    );

    expect(drawn.getByRole('button', { name: 'Play' })).toHaveProp('hasTVPreferredFocus', true);

    await fireEvent(drawn.getByRole('button', { name: 'Play' }), 'focus');

    expect(drawn.getByRole('button', { name: 'Play' })).toHaveProp('hasTVPreferredFocus', false);
  });

  it('cannot be pressed or landed on while it is held off', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <Focusable label="Play" onPress={onPress} isDisabled>
        <Text>Play</Text>
      </Focusable>,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Play' }));

    expect(onPress).not.toHaveBeenCalled();
    expect(drawn.getByRole('button', { name: 'Play' })).toBeDisabled();
    expect(drawn.getByRole('button', { name: 'Play' })).toHaveProp('focusable', false);
  });
});
