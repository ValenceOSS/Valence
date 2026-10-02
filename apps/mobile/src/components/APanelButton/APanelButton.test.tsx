import { render, userEvent } from '@testing-library/react-native';
import { APanelButton } from './APanelButton';

describe('APanelButton', () => {
  it('says what it does and does it', async () => {
    const onPress = jest.fn();
    const drawn = await render(<APanelButton says="Join" onPress={onPress} isStrong />);

    await userEvent.press(drawn.getByLabelText('Join'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does nothing while it cannot be pressed', async () => {
    const onPress = jest.fn();
    const drawn = await render(<APanelButton says="Set" onPress={onPress} isDisabled />);

    await userEvent.press(drawn.getByLabelText('Set'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
