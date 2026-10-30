import { Gauge } from '@keyline-icons/react-native';
import { render, userEvent } from '@testing-library/react-native';
import { ARemoteChoice } from './ARemoteChoice';

describe('ARemoteChoice', () => {
  it('says what it is and what it is set to, and takes a press', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <ARemoteChoice icon={Gauge} label="Speed" value="Normal" onPress={onPress} />,
    );

    expect(drawn.getByText('Speed')).toBeTruthy();
    expect(drawn.getByText('Normal')).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('Speed, Normal'));

    expect(onPress).toHaveBeenCalled();
  });

  it('is called only what it is where it sets nothing', async () => {
    const drawn = await render(
      <ARemoteChoice icon={Gauge} label="Play here" onPress={jest.fn()} />,
    );

    expect(drawn.getByLabelText('Play here')).toBeTruthy();
  });
});
