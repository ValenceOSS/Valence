import { render, userEvent } from '@testing-library/react-native';
import { APlayButton } from './APlayButton';

describe('APlayButton', () => {
  it('plays when pressed', async () => {
    const onPress = jest.fn();
    const drawn = await render(<APlayButton says="Play" onPress={onPress} />);

    await userEvent.press(drawn.getByText('Play'));

    expect(onPress).toHaveBeenCalled();
  });

  it('cannot be pressed while it is disabled or busy', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <>
        <APlayButton says="Request" isDisabled onPress={onPress} />
        <APlayButton says="Sending" isBusy onPress={onPress} />
      </>,
    );

    expect(drawn.getByRole('button', { name: 'Request', disabled: true })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Sending', disabled: true })).toBeTruthy();
  });

  it('is only drawn, for a menu around it to open, where it is given nothing to do', async () => {
    const drawn = await render(<APlayButton says="Request" />);

    expect(drawn.getByText('Request')).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Request' })).toBeNull();
  });

  it('offers no way to start again where there is nothing to carry on from', async () => {
    const drawn = await render(<APlayButton says="Play" onPress={jest.fn()} />);

    expect(drawn.queryByLabelText('Start again')).toBeNull();
  });

  it('starts again from its second segment where it carries on', async () => {
    const onPress = jest.fn();
    const onStartAgain = jest.fn();
    const drawn = await render(
      <APlayButton
        says="Resume from 34m"
        watched={0.4}
        onPress={onPress}
        onStartAgain={onStartAgain}
      />,
    );

    await userEvent.press(drawn.getByLabelText('Start again'));

    expect(onStartAgain).toHaveBeenCalled();
    expect(onPress).not.toHaveBeenCalled();
  });
});
