import { render, userEvent } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { TheBell } from './TheBell';

jest.mock('@ValenceClient/notifications/fetchNotifications', () => ({
  fetchNotifications: jest.fn(() => Promise.resolve({ notifications: [], unread: 0 })),
}));

describe('TheBell', () => {
  it('opens what the server has said when pressed', async () => {
    installPlatform(aFakePlatform());
    const onPress = jest.fn();
    const drawn = await render(
      <CacheScope>
        <TheBell onPress={onPress} />
      </CacheScope>,
    );

    await userEvent.press(drawn.getByRole('button'));

    expect(onPress).toHaveBeenCalled();
  });
});
