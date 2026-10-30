import { Inbox } from '@keyline-icons/react-native';
import { render, userEvent } from '@testing-library/react-native';
import { AnAccountTile } from './AnAccountTile';

describe('AnAccountTile', () => {
  it('says how many there are and what they are, and opens them', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <AnAccountTile icon={Inbox} says="Inbox" figure={12} isNews onPress={onPress} />,
    );

    expect(drawn.getByText('12')).toBeTruthy();
    expect(drawn.getByText('Inbox')).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('Inbox'));

    expect(onPress).toHaveBeenCalled();
  });
});
