import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchNotifications } from '@ValenceClient/notifications/fetchNotifications';
import { TheNotifications } from './TheNotifications';

jest.mock('@ValenceClient/notifications/fetchNotifications', () => ({
  ...jest.requireActual<object>('@ValenceClient/notifications/fetchNotifications'),
  fetchNotifications: jest.fn(),
  markNotificationsRead: jest.fn(() => Promise.resolve(true)),
}));

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheNotifications', () => {
  it('lists what the server has said, and opens what one is about', async () => {
    jest.mocked(fetchNotifications).mockResolvedValue({
      notifications: [
        {
          id: '00000000-0000-4000-8000-0000000000d1',
          event: 'media.added',
          title: 'Dune is here',
          body: 'Added to Books.',
          link: '/?book=dune',
          createdAt: '2026-09-23T10:00:00.000Z',
          readAt: null,
        },
      ],
      unread: 1,
    });
    const onOpen = jest.fn();
    const drawn = await render(<TheNotifications onOpen={onOpen} onBack={jest.fn()} />, {
      wrapper: CacheScope,
    });

    await userEvent.press(await drawn.findByRole('button', { name: 'Dune is here' }));

    expect(onOpen).toHaveBeenCalledWith({ kind: 'book', bookId: 'dune' });
  });
});
