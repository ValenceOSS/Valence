import { SlidersHorizontal } from '@keyline-icons/react-native';
import { render, userEvent } from '@testing-library/react-native';
import { AGlassCircle } from './AGlassCircle';

describe('AGlassCircle', () => {
  it('is a round button named for what it does', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <AGlassCircle of={SlidersHorizontal} label="Contents and settings" onPress={onPress} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Contents and settings' }));

    expect(onPress).toHaveBeenCalled();
  });
});
