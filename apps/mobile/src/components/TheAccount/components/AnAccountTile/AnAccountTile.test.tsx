import { Inbox } from '@keyline-icons/react-native/fill';
import { render, userEvent } from '@testing-library/react-native';
import { AnAccountTile } from './AnAccountTile';

describe('AnAccountTile', () => {
  it('says what it opens and how it stands, and opens it', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <AnAccountTile
        icon={Inbox}
        tint="#ff453a"
        says="Inbox"
        detail="2 unread"
        count={2}
        onPress={onPress}
      />,
    );

    expect(drawn.getByText('Inbox')).toBeTruthy();
    expect(drawn.getByText('2 unread')).toBeTruthy();
    expect(drawn.getByText('2')).toBeTruthy();

    await userEvent.press(drawn.getByText('Inbox'));

    expect(onPress).toHaveBeenCalled();
  });

  it('draws no count where nothing is waiting', async () => {
    const drawn = await render(
      <AnAccountTile
        icon={Inbox}
        tint="#ff453a"
        says="Inbox"
        detail="All caught up"
        count={0}
        onPress={jest.fn()}
      />,
    );

    expect(drawn.queryByText('0')).toBeNull();
  });
});
