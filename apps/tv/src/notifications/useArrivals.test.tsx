import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useArrivals } from '@ValenceTv/notifications/useArrivals';
import type { ReactNode } from 'react';
import type { Notification } from '@ValenceContracts/schemas/Notification';

const mockInbox: { notifications: Notification[] } = { notifications: [] };

const mockMarkRead = jest.fn<Promise<number>, [string | undefined]>(() => Promise.resolve(1));

jest.mock('@ValenceClient/notifications/fetchNotifications', () => ({
  ...jest.requireActual<object>('@ValenceClient/notifications/fetchNotifications'),
  fetchNotifications: () =>
    Promise.resolve({
      notifications: [...mockInbox.notifications],
      unread: mockInbox.notifications.length,
    }),
  markNotificationsRead: (id?: string) => mockMarkRead(id),
}));

const aNotice = (id: string, overrides: Partial<Notification> = {}): Notification => ({
  id,
  event: 'requests.available',
  title: 'Dune is here',
  body: 'Ready to watch',
  link: '/?item=dune',
  createdAt: '2026-09-23T00:00:00.000Z',
  readAt: null,
  ...overrides,
});

const OLD = aNotice('00000000-0000-4000-8000-000000000001');

const NEW = aNotice('00000000-0000-4000-8000-000000000002');

const settle = async (): Promise<void> => {
  await act(async () => {
    await new Promise((settled) => {
      setTimeout(settled, 10);
    });
  });
};

const withTheInbox = async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const WithTheCache = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  WithTheCache.displayName = 'WithTheCache';

  const drawn = await renderHook(() => useArrivals(), { wrapper: WithTheCache });

  await waitFor(() => {
    expect(client.getQueryData(['notifications', 'inbox'])).toBeDefined();
  });
  await settle();

  const arrives = async (notices: Notification[]): Promise<void> => {
    mockInbox.notifications = notices;
    await act(async () => {
      await client.refetchQueries({ queryKey: ['notifications', 'inbox'] });
    });
    await settle();
  };

  return { ...drawn, arrives };
};

beforeEach(() => {
  mockInbox.notifications = [OLD];
  mockMarkRead.mockClear();
});

describe('useArrivals', () => {
  it('does not announce what was already in the inbox', async () => {
    const { result } = await withTheInbox();

    expect(result.current.arrival).toBeNull();
  });

  it('announces something that arrives, once, and marks it read', async () => {
    const { result, arrives } = await withTheInbox();

    await arrives([NEW, OLD]);

    expect(result.current.arrival).toEqual(NEW);
    expect(mockMarkRead).toHaveBeenCalledWith(NEW.id);

    await act(() => {
      result.current.dismiss();
    });
    await arrives([NEW, OLD]);

    expect(result.current.arrival).toBeNull();
    expect(mockMarkRead).toHaveBeenCalledTimes(1);
  });

  it('announces only arrivals of what was asked for, not yet read', async () => {
    const { result, arrives } = await withTheInbox();

    await arrives([
      aNotice('00000000-0000-4000-8000-000000000003', { event: 'media.added' }),
      aNotice('00000000-0000-4000-8000-000000000004', { readAt: '2026-09-23T01:00:00.000Z' }),
      OLD,
    ]);

    expect(result.current.arrival).toBeNull();
    expect(mockMarkRead).not.toHaveBeenCalled();
  });
});
