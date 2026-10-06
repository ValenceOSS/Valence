import { Heart } from '@keyline-icons/react-native';
import { render, userEvent } from '@testing-library/react-native';
import { AQuickCard } from './AQuickCard';

describe('AQuickCard', () => {
  it('names what it opens, and opens it when pressed', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <AQuickCard title="Liked songs" artwork={null} standIn={Heart} onPress={onPress} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Liked songs' }));

    expect(onPress).toHaveBeenCalled();
  });

  it('says when it is held', async () => {
    const onLongPress = jest.fn();
    const drawn = await render(
      <AQuickCard
        title="Hey What"
        artwork={null}
        standIn={Heart}
        onPress={jest.fn()}
        onLongPress={onLongPress}
      />,
    );

    await userEvent.longPress(drawn.getByRole('button', { name: 'Hey What' }));

    expect(onLongPress).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AQuickCard.displayName).toBe('AQuickCard');
  });
});
