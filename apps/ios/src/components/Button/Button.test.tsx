import { render, userEvent } from '@testing-library/react-native';
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
