import { Heart } from '@keyline-icons/react-native';
import { render, userEvent } from '@testing-library/react-native';
import { ARoundAction } from './ARoundAction';

describe('ARoundAction', () => {
  it('says what it does beneath it, and does it', async () => {
    const onPress = jest.fn();
    const drawn = await render(<ARoundAction icon={Heart} says="Favourite" onPress={onPress} />);

    expect(drawn.getByText('Favourite')).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('Favourite'));

    expect(onPress).toHaveBeenCalled();
  });

  it('says whether what it stands for is on', async () => {
    const drawn = await render(
      <ARoundAction icon={Heart} says="Favourite" isChosen onPress={jest.fn()} />,
    );

    expect(drawn.getByLabelText('Favourite')).toBeSelected();
  });
});
