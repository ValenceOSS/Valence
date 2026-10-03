import { render, userEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { markNotificationsRead } from '@ValenceClient/notifications/fetchNotifications';
import { notificationQueries } from '@ValenceClient/query/notificationQueries';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { YourNotifications } from '@ValenceTv/screens/Account/components/YourNotifications/YourNotifications';
import type { Notification } from '@ValenceContracts/schemas/Notification';

jest.mock('@ValenceClient/notifications/fetchNotifications', () => ({
  fetchNotifications: jest.fn(() => new Promise(() => undefined)),
  markNotificationsRead: jest.fn(() => Promise.resolve(0)),
}));

const aNotice = (id: string, title: string, link: string | null, isRead = false): Notification => ({
  id,
  event: 'requests.available',
  title: sayVerbatim(title),
  body: sayVerbatim('It is ready to watch.'),
  link,
  createdAt: new Date().toISOString(),
  readAt: isRead ? new Date().toISOString() : null,
});

const drawWith = (
  notifications: Notification[],
  onOpen = jest.fn(),
  onJoin = jest.fn(),
  unread = notifications.filter((notice) => notice.readAt === null).length,
) => {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } },
  });

  cache.setQueryData(notificationQueries.inbox().queryKey, { notifications, unread });

  return render(
    <QueryClientProvider client={cache}>
      <YourNotifications onOpen={onOpen} onJoin={onJoin} onFocus={jest.fn()} />
    </QueryClientProvider>,
  );
};

beforeEach(() => {
  jest.mocked(markNotificationsRead).mockClear();
});

describe('YourNotifications', () => {
  it('draws nothing when there has been nothing to tell', async () => {
    const drawn = await drawWith([]);

    expect(drawn.queryByText('Notifications')).toBeNull();
  });

  it('marks what is unread, and offers to mark it all read', async () => {
    const drawn = await drawWith([
      aNotice('00000000-0000-4000-8000-000000000001', 'Dune is here', '/?item=dune'),
      aNotice('00000000-0000-4000-8000-000000000002', 'Arrival is here', null, true),
    ]);

    expect(drawn.getByText('Dune is here · New')).toBeTruthy();
    expect(drawn.getByText('Arrival is here')).toBeTruthy();

    await userEvent.press(drawn.getByText('Mark all read'));

    await waitFor(() => {
      expect(markNotificationsRead).toHaveBeenCalledWith();
    });
  });

  it('opens the film a notice names, reading it as it does', async () => {
    const onOpen = jest.fn();
    const drawn = await drawWith(
      [aNotice('00000000-0000-4000-8000-000000000001', 'Dune is here', '/?item=dune')],
      onOpen,
    );

    await userEvent.press(drawn.getByText('Dune is here · New'));

    expect(onOpen).toHaveBeenCalledWith({ kind: 'film', mediaId: 'dune' });
    expect(markNotificationsRead).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000001');
  });

  it('offers to mark everything read where the unread are further down than it shows', async () => {
    const drawn = await drawWith(
      [aNotice('00000000-0000-4000-8000-000000000004', 'Arrival is here', null, true)],
      jest.fn(),
      jest.fn(),
      3,
    );

    expect(drawn.getByText('Mark all read')).toBeTruthy();
  });

  it('joins the watch party an invitation asks them into', async () => {
    const onOpen = jest.fn();
    const onJoin = jest.fn();
    const drawn = await drawWith(
      [
        aNotice(
          '00000000-0000-4000-8000-000000000003',
          'Jo asked you to watch Dune',
          '/watch/dune?party=p-1',
        ),
      ],
      onOpen,
      onJoin,
    );

    await userEvent.press(drawn.getByText('Jo asked you to watch Dune · New'));

    expect(onJoin).toHaveBeenCalledWith({ kind: 'watch', partyId: 'p-1', mediaId: 'dune' });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('opens nothing for a notice that names nothing to watch', async () => {
    const onOpen = jest.fn();
    const drawn = await drawWith(
      [aNotice('00000000-0000-4000-8000-000000000002', 'A plugin says hello', null, true)],
      onOpen,
    );

    await userEvent.press(drawn.getByText('A plugin says hello'));

    expect(onOpen).not.toHaveBeenCalled();
    expect(markNotificationsRead).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(YourNotifications.displayName).toBe('YourNotifications');
  });
});
