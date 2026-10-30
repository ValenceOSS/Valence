import { ListVideo } from '@keyline-icons/react-native/fill';
import { render, userEvent } from '@testing-library/react-native';
import { AWideButton } from './AWideButton';

describe('AWideButton', () => {
  it('says what it does, and does it', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <AWideButton
        icon={ListVideo}
        says="All episodes"
        label="All episodes of Reacher"
        onPress={onPress}
      />,
    );

    expect(drawn.getByText('All episodes')).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('All episodes of Reacher'));

    expect(onPress).toHaveBeenCalled();
  });
});
