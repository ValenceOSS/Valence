import { render, userEvent } from '@testing-library/react-native';
import { AMusicTile } from './AMusicTile';

describe('AMusicTile', () => {
  it('names what it is, says what else there is to know, and opens it', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <AMusicTile title="Even In Arcadia" detail="Sleep Token" artwork={null} onPress={onPress} />,
    );

    expect(drawn.getByText('Sleep Token')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Even In Arcadia' }));

    expect(onPress).toHaveBeenCalled();
  });
});
