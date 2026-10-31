import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Button } from './Button';

describe('Button', () => {
  it('says what it does', async () => {
    const drawn = await render(<Button onPress={jest.fn()}>Connect</Button>);

    expect(drawn.getByText('Connect')).toBeTruthy();
  });

  it('does it when pressed', async () => {
    const onPress = jest.fn();
    const drawn = await render(<Button onPress={onPress}>Connect</Button>);

    await userEvent.press(drawn.getByText('Connect'));

    expect(onPress).toHaveBeenCalled();
  });

  it('shows it is working instead of its words, so nobody presses twice', async () => {
    const drawn = await render(
      <Button isBusy onPress={jest.fn()}>
        Connect
      </Button>,
    );

    expect(drawn.queryByText('Connect')).toBeNull();
  });

  it('cannot be pressed while it is working', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <Button isBusy onPress={onPress} label="Connect">
        Connect
      </Button>,
    );

    await userEvent.press(drawn.getByLabelText('Connect'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('cannot be pressed when it is disabled', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <Button isDisabled onPress={onPress}>
        Connect
      </Button>,
    );

    await userEvent.press(drawn.getByText('Connect'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('is a button to anything reading the screen aloud', async () => {
    const drawn = await render(<Button onPress={jest.fn()}>Connect</Button>);

    expect(drawn.getByRole('button')).toBeTruthy();
  });
});

describe('a bare one', () => {
  it('presses what it was given, rather than turning it into words', async () => {
    const drawn = await render(
      <Button tone="bare" label="Arrival" onPress={jest.fn()}>
        <Text>Arrival</Text>
      </Button>,
    );

    expect(drawn.getByText('Arrival')).toBeTruthy();
  });

  it('still takes a press', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <Button tone="bare" label="Arrival" onPress={onPress}>
        <Text>Arrival</Text>
      </Button>,
    );

    await userEvent.press(drawn.getByLabelText('Arrival'));

    expect(onPress).toHaveBeenCalled();
  });

  it('says which one is picked, where it is one of several', async () => {
    const drawn = await render(
      <Button tone="bare" label="Arrival" isChosen onPress={jest.fn()}>
        <Text>Arrival</Text>
      </Button>,
    );

    expect(drawn.getByRole('button', { name: 'Arrival', selected: true })).toBeTruthy();
  });

  it('offers a screen reader a way to put away what it opens', async () => {
    const onDismiss = jest.fn();
    const drawn = await render(
      <Button
        tone="bare"
        label="Arrival"
        dismissal={{ label: 'Hide it', onDismiss }}
        onPress={jest.fn()}
      >
        <Text>Arrival</Text>
      </Button>,
    );
    const button = drawn.getByLabelText('Arrival');

    expect(button.props.accessibilityActions).toEqual([{ name: 'dismiss', label: 'Hide it' }]);

    await fireEvent(button, 'accessibilityAction', { nativeEvent: { actionName: 'dismiss' } });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('draws itself without taking a press where a menu holding it takes the press', async () => {
    const drawn = await render(
      <Button tone="ghost" isOnlyDrawn>
        More
      </Button>,
    );

    expect(drawn.getByText('More')).toBeTruthy();
    expect(drawn.queryByRole('button')).toBeNull();
  });
});
